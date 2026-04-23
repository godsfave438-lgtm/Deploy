const API_URL = "https://deploy-4ooy.onrender.com";

let token = localStorage.getItem("token");
let editingId = null;
let isLogin = true;

// ELEMENTS
const authBox = document.getElementById("authBox");
const app = document.getElementById("app");

const email = document.getElementById("email");
const password = document.getElementById("password");
const authBtn = document.getElementById("authBtn");
const authToggle = document.getElementById("authToggle");
const authError = document.getElementById("authError");

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

// TOGGLE LOGIN / REGISTER
authToggle.onclick = () => {
  isLogin = !isLogin;

  authBtn.textContent = isLogin ? "Login" : "Register";
  authToggle.textContent = isLogin
    ? "Don't have an account? Register"
    : "Already have an account? Login";
};

// AUTH (LOGIN + REGISTER)
authBtn.onclick = async () => {
  authError.textContent = "";

  const endpoint = isLogin ? "/auth/login" : "/auth/register";

  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.value,
      password: password.value
    })
  });

  const data = await res.json();

  if (!res.ok) {
    authError.textContent = data.error || "Error";
    return;
  }

  // LOGIN SUCCESS
  if (isLogin) {
    token = data.token;
    localStorage.setItem("token", token);

    authBox.style.display = "none";
    app.style.display = "block";

    fetchStudents();
  } else {
    alert("Account created! Please login.");
    isLogin = true;
    authBtn.textContent = "Login";
    authToggle.textContent = "Don't have an account? Register";
  }
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

        li.innerHTML = `
          ${s.name}
          <button onclick="deleteStudent('${id}')">Delete</button>
        `;

        list.appendChild(li);
      });
    });
}

// ADD STUDENT
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

// DELETE STUDENT
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