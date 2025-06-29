document.getElementById("moodForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const mood = document.getElementById("mood").value;
  const journal = document.getElementById("journal").value;
  const date = new Date().toLocaleDateString();

  const entry = `${date} - Mood: ${mood}\n${journal}\n---`;
  let log = localStorage.getItem("journalLog") || "";
  log = `${entry}\n${log}`;
  localStorage.setItem("journalLog", log);

  document.getElementById("log").textContent = log;
  document.getElementById("journal").value = "";
});

function loadJournalLog() {
  const log = localStorage.getItem("journalLog") || "";
  document.getElementById("log").textContent = log;
}

function addHabit() {
  const habitInput = document.getElementById("habitInput");
  const habit = habitInput.value.trim();
  if (!habit) return;
  const li = document.createElement("li");
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.onclick = () => checkbox.disabled = true;
  li.appendChild(checkbox);
  li.appendChild(document.createTextNode(" " + habit));
  document.getElementById("habitList").appendChild(li);
  habitInput.value = "";
}

window.onload = loadJournalLog;
