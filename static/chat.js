// static/chat.js (updated, robust)
document.addEventListener("DOMContentLoaded", () => {
  const messagesEl = document.getElementById("messages");
  const optionsEl = document.getElementById("options");
  const inputForm = document.getElementById("input-form");
  const inputEl = document.getElementById("message-input");
  const startupGreetingEl = document.getElementById("startup-greeting");

  let lastOptions = []; // holds latest options {id, label, tag}

  function appendMessage(text, who = "bot") {
    const wrap = document.createElement("div");
    wrap.className = who + " message";
    const b = document.createElement("div");
    b.className = "bubble";
    b.textContent = text;
    wrap.appendChild(b);
    messagesEl.appendChild(wrap);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function showOptions(options) {
    lastOptions = options;
    optionsEl.innerHTML = "";
    if (!options || options.length === 0) return;
    options.forEach(opt => {
      const btn = document.createElement("button");
      btn.className = "option-btn";
      btn.textContent = opt.label;
      btn.type = "button";
      btn.addEventListener("click", () => selectOption(opt));
      optionsEl.appendChild(btn);
    });
  }

  function setTyping(on = true) {
    // manage a small typing indicator
    let typingEl = document.getElementById("typing-indicator");
    if (on) {
      if (!typingEl) {
        typingEl = document.createElement("div");
        typingEl.id = "typing-indicator";
        typingEl.className = "bot message";
        const b = document.createElement("div");
        b.className = "bubble";
        b.textContent = "VenuBot is thinking 🎶...";
        typingEl.appendChild(b);
        messagesEl.appendChild(typingEl);
        messagesEl.scrollTop = messagesEl.scrollHeight;
      }
    } else {
      if (typingEl) typingEl.remove();
    }
  }

  async function postMessage(payload) {
    try {
      const res = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error("Network error: " + res.status);
      }
      return await res.json();
    } catch (err) {
      console.error("chat post failed", err);
      return { bot_message: "Sorry — I couldn't reach the server. Try again.", options: [] };
    }
  }

  async function selectOption(opt) {
    appendMessage(opt.label, "user");
    setTyping(true);
    try {
      const resp = await postMessage({ option_tag: opt.tag, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setTyping(false);
      appendMessage(resp.bot_message, "bot");
      showOptions(resp.options.map(o => ({ label: o.label, tag: o.tag, id: o.id })));
      inputEl.value = "";
    } catch (e) {
      setTyping(false);
      appendMessage("Oops — something went wrong. Try again.", "bot");
    }
  }

  async function sendMessage(event) {
    // prevent default form submit (this stops the page reloading)
    if (event && event.preventDefault) event.preventDefault();

    const text = inputEl.value.trim();
    if (!text) return;

    appendMessage(text, "user");
    inputEl.value = "";
    inputEl.disabled = true;
    setTyping(true);

    try {
      const resp = await postMessage({ message: text, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
      setTyping(false);
      appendMessage(resp.bot_message, "bot");
      showOptions(resp.options.map(o => ({ label: o.label, tag: o.tag, id: o.id })));
    } catch (err) {
      setTyping(false);
      appendMessage("Sorry, something went wrong. Please try again.", "bot");
    } finally {
      inputEl.disabled = false;
      inputEl.focus();
    }
  }

  // hook up form submit safely
  inputForm.addEventListener("submit", sendMessage);

  // initialize: request initial options and startup bot message from server
  (async function init() {
    // Show startup greeting only once (provided by template)
    if (startupGreetingEl && startupGreetingEl.textContent.trim()) {
      appendMessage(startupGreetingEl.textContent.trim() + "!", "bot");
    }

    setTyping(true);
    const resp = await postMessage({ message: "", timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    setTyping(false);
    // server's initial bot_message may be a prompt like "Say something..." or a dynamic greeting
    appendMessage(resp.bot_message, "bot");
    showOptions(resp.options.map(o => ({ label: o.label, tag: o.tag, id: o.id })));
  })();

});
