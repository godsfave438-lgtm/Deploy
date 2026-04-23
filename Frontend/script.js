// ⚙️ script.js (WITH AUTH)
const API_URL = "https://deploy-4ooy.onrender.com";

let token = localStorage.getItem("token");
let editingId = null;

const loginBox = document.getElementById("loginBox");
const app = document.getElementById("app");

const email = document.getElementById("email");
const password = document.getElementById("password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const nameInput = document.getElementById("name");
const list = document.getElementById("list");
const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const logoutBtn = document.getElementById("logoutBtn");

function getHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// LOGIN
loginBtn.onclick = async () => {
  loginError.textContent = "";

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.value,
        password: password.value
      })
    });

    const data = await res.json();

    if (!data.token) {
      loginError.textContent = "Invalid login";
      return;
    }

    token = data.token;
    localStorage.setItem("token", token);

    loginBox.style.display = "none";
    app.style.display = "block";

    fetchStudents();

  } catch (err) {
    loginError.textContent = "Server error";
  }
};

// LOGOUT
logoutBtn.onclick = () => {
  localStorage.removeItem("token");
  token = null;
  location.reload();
};

// FETCH STUDENTS
function fetchStudents() {
  fetch(`${API_URL}/students`, { headers: getHeaders() })
    .then(res => res.json())
    .then(data => {
      const students = data.students || data;
      list.innerHTML = "";

      students.forEach(s => {
        const id = s._id || s.id;

        const li = document.createElement("li");
        li.className = "item";

        li.innerHTML = `
          <span>${s.name}</span>
          <div class="actions">
            <button class="edit" onclick='editStudent(${JSON.stringify(s)})'>Edit</button>
            <button class="delete" onclick='deleteStudent("${id}")'>Delete</button>
          </div>
        `;

        list.appendChild(li);
      });
    });
}

// ADD
addBtn.onclick = () => {
  fetch(`${API_URL}/students`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ name: nameInput.value })
  }).then(() => {
    nameInput.value = "";
    fetchStudents();
  });
};

// DELETE
function deleteStudent(id) {
  fetch(`${API_URL}/students/${id}`, {
    method: "DELETE",
    headers: getHeaders()
  }).then(() => fetchStudents());
}

// EDIT
function editStudent(student) {
  nameInput.value = student.name;
  editingId = student._id || student.id;

  addBtn.style.display = "none";
  updateBtn.style.display = "block";
}

// UPDATE
updateBtn.onclick = () => {
  fetch(`${API_URL}/students/${editingId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify({ name: nameInput.value })
  }).then(() => {
    nameInput.value = "";
    editingId = null;

    addBtn.style.display = "block";
    updateBtn.style.display = "none";

    fetchStudents();
  });
};

// AUTO LOGIN IF TOKEN EXISTS
if (token) {
  loginBox.style.display = "none";
  app.style.display = "block";
  fetchStudents();
}