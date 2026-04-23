const API_URL = "https://deploy-4ooy.onrender.com";

let token = localStorage.getItem("token");
let editingId = null;

// UI ELEMENTS
const authBox = document.getElementById("authBox");
const app = document.getElementById("app");

const loginEmail = document.getElementById("loginEmail");
const loginPassword = document.getElementById("loginPassword");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const registerEmail = document.getElementById("registerEmail");
const registerPassword = document.getElementById("registerPassword");
const registerBtn = document.getElementById("registerBtn");
const registerError = document.getElementById("registerError");

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

// SWITCH TABS
function showLogin() {
  document.getElementById("loginBox").style.display = "flex";
  document.getElementById("registerBox").style.display = "none";
}

function showRegister() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "flex";
}

// REGISTER
registerBtn.onclick = async () => {
  registerError.textContent = "";

  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: registerEmail.value,
      password: registerPassword.value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    registerError.textContent = data.error || "Register failed";
    return;
  }

  alert("Account created! Please login.");
  showLogin();
};

// LOGIN
loginBtn.onclick = async () => {
  loginError.textContent = "";

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: loginEmail.value,
        password: loginPassword.value
      })
    });

    const data = await res.json();

    // ❌ IMPORTANT FIX
    if (!res.ok) {
      loginError.textContent = data.error || "Login failed";
      return;
    }

    if (!data.token) {
      loginError.textContent = "No token received from server";
      return;
    }

    token = data.token;
    localStorage.setItem("token", token);

    authBox.style.display = "none";
    app.style.display = "block";

    fetchStudents();

  } catch (err) {
    loginError.textContent = "Server unreachable";
    console.error(err);
  }

  token = data.token;
  localStorage.setItem("token", token);

  authBox.style.display = "none";
  app.style.display = "block";

  fetchStudents();
};

// LOGOUT
logoutBtn.onclick = () => {
  localStorage.removeItem("token");
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
        li.innerHTML = `${s.name} <button onclick="deleteStudent('${id}')">Delete</button>`;
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

// AUTO LOGIN
if (token) {
  authBox.style.display = "none";
  app.style.display = "block";
  fetchStudents();
}