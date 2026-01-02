let tasks = JSON.parse(localStorage.getItem("tasks")) || {};
let filter = "all";
let editId = null;

/* ================= EMOJIS ================= */
const completedEmojis = [
  "✅","🎉","🥳","🔥","💪","😄","😎","🌟","🏆","✨",
  "🚀","🎯","👏","💚","😊","🥇","🙌","😇","🟢"
];

function getRandomEmoji(){
  return completedEmojis[Math.floor(Math.random()*completedEmojis.length)];
}

/* ================= CALENDAR STATE ================= */
let currentDate = new Date();
let calMonth = currentDate.getMonth();
let calYear = currentDate.getFullYear();
let activeTaskId = null;

/* ================= SAVE ================= */
function save(){
  localStorage.setItem("tasks", JSON.stringify(tasks));
}

/* ================= ADD TASK ================= */
function addTask(){
  const cat = categoryInput.value.trim();
  const text = taskInput.value.trim();

  if(!cat || !text) return alert("Category & Task required");

  if(!tasks[cat]) tasks[cat] = [];

  if(editId){
    for(const c in tasks){
      const t = tasks[c].find(x=>x.id===editId);
      if(t){
        t.text=text;
        t.start=startDate.value;
        t.end=endDate.value;
        t.priority=priority.value;
      }
    }
    editId=null;
  }else{
    tasks[cat].push({
      id:Date.now(),
      text,
      start:startDate.value,
      end:endDate.value,
      priority:priority.value,
      completed:false,
      emoji:"📝",
      selectedDates: [] // for clicked blue tick dates
    });
  }

  categoryInput.value="";
  taskInput.value="";
  startDate.value="";
  endDate.value="";

  save();
  renderTasks();
  updateStats();
}

/* ================= TASK ACTIONS ================= */
function toggleTask(id){
  for(const cat in tasks){
    const t = tasks[cat].find(x=>x.id===id);
    if(t){
      t.completed=!t.completed;
      t.emoji = t.completed ? getRandomEmoji() : "📝";
    }
  }
  save();
  renderTasks();
  updateStats();
}

function deleteTask(id){
  for(const cat in tasks){
    tasks[cat]=tasks[cat].filter(t=>t.id!==id);
    if(tasks[cat].length===0) delete tasks[cat];
  }
  save();
  renderTasks();
  updateStats();
}

function editTask(id){
  for(const cat in tasks){
    const t = tasks[cat].find(x=>x.id===id);
    if(t){
      categoryInput.value=cat;
      taskInput.value=t.text;
      startDate.value=t.start;
      endDate.value=t.end;
      priority.value=t.priority;
      editId=id;
    }
  }
}

/* ================= FILTER ================= */
function setFilter(f){
  filter=f;
  renderTasks();
}

/* ================= RENDER TASKS ================= */
function renderTasks() {
  const container = document.getElementById("tasksContainer");
  container.innerHTML = "";

  for (const cat in tasks) {
    let monthMap = {};

    tasks[cat].forEach(t => {
      if (filter === "active" && t.completed) return;
      if (filter === "completed" && !t.completed) return;

      const m = t.start
        ? new Date(t.start).toLocaleString("default", { month: "long", year: "numeric" })
        : "No Date";

      if (!monthMap[m]) monthMap[m] = [];
      monthMap[m].push(t);
    });

    if (Object.keys(monthMap).length === 0) continue;

    // CREATE CATEGORY HEADER
    const containerDiv = document.createElement("div");

    const headerDiv = document.createElement("div");
    headerDiv.className = "category-header";
    headerDiv.innerHTML = `📁 ${cat}`;

    // Toggle content on click
    headerDiv.addEventListener("click", () => {
      const contentDiv = headerDiv.nextSibling;
      if (contentDiv.style.display === "none") {
        contentDiv.style.display = "block";
      } else {
        contentDiv.style.display = "none";
      }
    });

    containerDiv.appendChild(headerDiv);

    // CREATE TASK CONTENT DIV (wrapped as a card)
    const tasksDiv = document.createElement("div");
    tasksDiv.className = "category-tasks"; // <-- important class
    tasksDiv.style.display = "block"; // initially visible

    for (const month in monthMap) {
      const monthDiv = document.createElement("div");
      monthDiv.className = "month-title";
      monthDiv.innerText = `📅 ${month}`;
      tasksDiv.appendChild(monthDiv);

      monthMap[month].forEach(t => {
        const taskDiv = document.createElement("div");
        taskDiv.className = `task-item ${t.completed ? "completed" : ""}`;
        taskDiv.onclick = () => openCalendar(t.id);
        taskDiv.innerHTML = `
          <input type="checkbox" ${t.completed ? "checked" : ""}
            onclick="event.stopPropagation(); toggleTask(${t.id})">
          <div>
            <b>${t.emoji} ${t.text}</b><br>
            <small>
              Priority: ${t.priority} |
              Start: ${t.start || "-"} |
              End: ${t.end || "-"}
            </small>
          </div>
          <div class="task-actions">
            <button onclick="event.stopPropagation(); editTask(${t.id})">✏️</button>
            
            <button onclick="event.stopPropagation(); deleteTask(${t.id})">🗑</button>
          </div>
        `;
        tasksDiv.appendChild(taskDiv);
      });
    }

    containerDiv.appendChild(tasksDiv);
    container.appendChild(containerDiv);
  }
}


/* ================= STATS ================= */
function updateStats(){
  let total = 0, done = 0;

  Object.values(tasks).forEach(arr=>{
    total += arr.length;
    done += arr.filter(t=>t.completed).length;
  });

  totalTasks.textContent = total;
  completedTasks.textContent = done;
  pendingTasks.textContent = total - done;

  /* ===== CIRCULAR PROGRESS ===== */
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  document.getElementById("progressPercent").innerText = percent + "%";

  const circle = document.querySelector(".ring-progress");
  const radius = 52;
  const circumference = 2 * Math.PI * radius;

  circle.style.strokeDasharray = circumference;
  circle.style.strokeDashoffset =
    circumference - (percent / 100) * circumference;
}


/* ================= CALENDAR FUNCTIONS ================= */

function openCalendar(taskId){
  activeTaskId = taskId;
  document.getElementById("calendarPopup").classList.remove("hidden");
  renderCalendar();
}

function closeCalendar(){
  document.getElementById("calendarPopup").classList.add("hidden");
}

function changeMonth(step){
  calMonth += step;
  if(calMonth < 0){ calMonth=11; calYear--; }
  if(calMonth > 11){ calMonth=0; calYear++; }
  renderCalendar();
}

function renderCalendar(){
  const grid = document.getElementById("calendarGrid");
  const title = document.getElementById("calendarTitle");
  grid.innerHTML="";

  const monthNames=[
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  title.innerText = `${monthNames[calMonth]} ${calYear}`;

  const weekDays = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  weekDays.forEach(day=>{
    const headerCell = document.createElement("div");
    headerCell.innerText = day;
    headerCell.style.fontWeight = "bold";
    headerCell.style.textAlign = "center";
    grid.appendChild(headerCell);
  });

  let days = new Date(calYear, calMonth+1, 0).getDate();
  let firstDay = new Date(calYear, calMonth, 1).getDay(); // 0=Sun

  let task = null;
  for(const cat in tasks){
    task = tasks[cat].find(t=>t.id===activeTaskId);
    if(task) break;
  }
  if(!task) return;
  if(!task.selectedDates) task.selectedDates = [];

  // Add empty cells for first day offset
  for(let i=0;i<firstDay;i++){
    const emptyCell = document.createElement("div");
    emptyCell.style.visibility = "hidden";
    grid.appendChild(emptyCell);
  }

  for(let d=1; d<=days; d++){
    let cell = document.createElement("div");
    cell.innerText = d;

    let dateStr = `${calYear}-${String(calMonth+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;

    if(task.start && task.end && dateStr>=task.start && dateStr<=task.end){
      cell.classList.add("task-day");
      if(task.completed){
        cell.classList.add("completed-day");
        cell.innerHTML = d+" ✅";
      }
    }

    if(task.selectedDates.includes(dateStr)){
      cell.classList.add("selected-day");
      cell.innerHTML = d + " ✔";
    }

    cell.addEventListener("click", (e)=>{
      e.stopPropagation();
      const index = task.selectedDates.indexOf(dateStr);
      if(index === -1){
        task.selectedDates.push(dateStr);
      } else {
        task.selectedDates.splice(index,1);
      }
      save();
      renderCalendar();
    });

    grid.appendChild(cell);
  }
}

/* ================= THEME ================= */
function toggleTheme(){
  document.body.classList.toggle("dark");
}

/* ================= INIT ================= */
window.onload=()=>{
  renderTasks();
  updateStats();
};

/* ================= BACKGROUND SLIDESHOW ================= */

const bgImages = [
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e",
  "https://images.unsplash.com/photo-1502082553048-f009c37129b9"
];

let bgIndex = 0;

function changeBackground(){
  document.body.classList.add("bg-image");
  document.body.style.backgroundImage =
    `linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.25)), url('${bgImages[bgIndex]}')`;

  bgIndex = (bgIndex + 1) % bgImages.length;
}

setInterval(changeBackground, 8000);
changeBackground(); // first load

