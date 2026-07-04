const API_URL = '/students';
const AUTH_URL = '/auth';

let token = localStorage.getItem('token');
let currentUser = JSON.parse(localStorage.getItem('user') || 'null');
let editingId = null;
let isLogin = true;
let allStudents = [];
let currentPage = 1;
const pageSize = 6;

const loginPage = document.getElementById('loginPage');
const dashboardPage = document.getElementById('dashboardPage');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const nameField = document.getElementById('nameField');
const displayName = document.getElementById('displayName');
const email = document.getElementById('email');
const password = document.getElementById('password');
const roleField = document.getElementById('roleField');
const accessCodeField = document.getElementById('accessCodeField');
const accessCode = document.getElementById('accessCode');
const authBtn = document.getElementById('authBtn');
const authToggle = document.getElementById('authToggle');
const authError = document.getElementById('authError');

const welcomeName = document.getElementById('welcomeName');
const roleBadge = document.getElementById('roleBadge');
const dashboardKicker = document.getElementById('dashboardKicker');
const dashboardTitle = document.getElementById('dashboardTitle');
const totalCount = document.getElementById('totalCount');
const totalLabel = document.getElementById('totalLabel');
const courseCount = document.getElementById('courseCount');

const recordForm = document.getElementById('recordForm');
const formKicker = document.getElementById('formKicker');
const formTitle = document.getElementById('formTitle');
const nameInput = document.getElementById('name');
const studentEmail = document.getElementById('studentEmail');
const matricNumber = document.getElementById('matricNumber');
const courses = document.getElementById('courses');
const saveBtn = document.getElementById('saveBtn');
const cancelBtn = document.getElementById('cancelBtn');
const studentError = document.getElementById('studentError');

const searchInput = document.getElementById('searchInput');
const list = document.getElementById('list');
const listTitle = document.getElementById('listTitle');
const emptyState = document.getElementById('emptyState');
const pagination = document.getElementById('pagination');
const logoutBtn = document.getElementById('logoutBtn');

function headers() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };
}

function roleLabel(role) {
  return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
}

function showMessage(element, message = '') {
  element.textContent = message;
}

function showLogin() {
  loginPage.hidden = false;
  dashboardPage.hidden = true;
  loginPage.classList.remove('hidden');
  dashboardPage.classList.add('hidden');
}

function showDashboard() {
  loginPage.hidden = true;
  dashboardPage.hidden = false;
  loginPage.classList.add('hidden');
  dashboardPage.classList.remove('hidden');
  configureDashboardForRole();
}

function requiresAccessCode(role) {
  return role === 'admin' || role === 'lecturer';
}

function updateAccessCodeVisibility() {
  const shouldShow = !isLogin && requiresAccessCode(selectedRole());
  accessCodeField.classList.toggle('hidden', !shouldShow);
  accessCode.required = shouldShow;
  if (!shouldShow) accessCode.value = '';
}

function setAuthMode(loginMode) {
  isLogin = loginMode;
  authTitle.textContent = isLogin ? 'Welcome back' : 'Create your access';
  authSubtitle.textContent = isLogin
    ? 'Sign in with your campus account.'
    : 'Choose the account type that matches your role.';
  authBtn.textContent = isLogin ? 'Sign in' : 'Create account';
  authToggle.textContent = isLogin ? 'Create a new account' : 'I already have an account';
  nameField.classList.toggle('hidden', isLogin);
  roleField.classList.toggle('hidden', isLogin);
  updateAccessCodeVisibility();
  password.autocomplete = isLogin ? 'current-password' : 'new-password';
  showMessage(authError);
}

function selectedRole() {
  return document.querySelector('input[name="role"]:checked')?.value || 'student';
}

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json() : {};

  if (response.status === 401) {
    logout();
    throw new Error('Session expired. Please sign in again.');
  }

  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }

  return data;
}

function studentProfileUpdateUsed() {
  return currentUser?.role === 'student' && Boolean(allStudents[0]?.profileUpdateUsed);
}

function setStudentFormReadonly(readonly) {
  [nameInput, matricNumber, courses].forEach((input) => {
    input.readOnly = readonly;
  });
}

function configureDashboardForRole() {
  const role = currentUser?.role || 'lecturer';
  const name = currentUser?.name || currentUser?.email || 'Dashboard';

  welcomeName.textContent = name;
  roleBadge.textContent = roleLabel(role);
  dashboardKicker.textContent = role === 'student' ? 'My profile' : 'Student records';
  dashboardTitle.textContent = role === 'student' ? 'Manage your student profile' : 'Student directory';
  totalLabel.textContent = role === 'admin' ? 'All records' : role === 'lecturer' ? 'Your records' : 'My profile';
  listTitle.textContent = role === 'admin' ? 'All students' : role === 'lecturer' ? 'Students you added' : 'Your profile record';

  if (role === 'student') {
    const hasProfile = allStudents.length > 0;
    const updateLocked = studentProfileUpdateUsed();

    formKicker.textContent = 'Profile';
    formTitle.textContent = updateLocked ? 'Profile update locked' : hasProfile ? 'Update your profile once' : 'Create your profile';
    studentEmail.value = currentUser.email;
    studentEmail.readOnly = true;
    saveBtn.textContent = updateLocked ? 'Profile update used' : hasProfile ? 'Update profile' : 'Save profile';
    saveBtn.disabled = updateLocked;
    setStudentFormReadonly(updateLocked);
  } else {
    formKicker.textContent = editingId ? 'Edit record' : 'Add record';
    formTitle.textContent = editingId ? 'Update student' : 'Create student';
    studentEmail.readOnly = false;
    saveBtn.textContent = editingId ? 'Update student' : 'Save student';
    saveBtn.disabled = false;
    setStudentFormReadonly(false);
  }
}

async function refreshCurrentUser() {
  const data = await apiRequest(`${AUTH_URL}/me`, { headers: headers() });
  currentUser = data.user;
  localStorage.setItem('user', JSON.stringify(currentUser));
}

async function getStudents() {
  try {
    showMessage(studentError);
    const data = await apiRequest(API_URL, { headers: headers() });
    allStudents = data.students || data || [];
    currentPage = 1;

    if (currentUser?.role === 'student' && allStudents[0] && !editingId) {
      editStudent(allStudents[0], true);
    }

    configureDashboardForRole();
    render();
  } catch (error) {
    showMessage(studentError, error.message);
  }
}

function getFilteredStudents() {
  const search = searchInput.value.trim().toLowerCase();
  if (!search) return allStudents;

  return allStudents.filter((student) => [
    student.name,
    student.email,
    student.matricNumber,
    ...(student.courses || [])
  ].some((value) => String(value || '').toLowerCase().includes(search)));
}

function render() {
  const filtered = getFilteredStudents();
  const start = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(start, start + pageSize);
  const coursesSeen = new Set(allStudents.flatMap((student) => student.courses || []));

  totalCount.textContent = allStudents.length;
  courseCount.textContent = coursesSeen.size;
  list.innerHTML = '';

  paginated.forEach((student) => {
    const row = document.createElement('tr');
    const canDelete = currentUser?.role === 'admin' || currentUser?.role === 'lecturer';
    const canUnlock = canDelete && student.profileUpdateUsed;

    row.innerHTML = `
      <td><strong>${escapeHtml(student.name || '')}</strong></td>
      <td>${escapeHtml(student.email || '')}</td>
      <td>${escapeHtml(student.matricNumber || '')}</td>
      <td><div class="course-tags">${(student.courses || []).map((course) => `<span>${escapeHtml(course)}</span>`).join('')}</div></td>
      <td><div class="row-actions"></div></td>
    `;

    const actions = row.querySelector('.row-actions');
    const updateLocked = currentUser?.role === 'student' && student.profileUpdateUsed;
    const editBtn = document.createElement('button');
    editBtn.className = 'icon-btn';
    editBtn.type = 'button';
    editBtn.textContent = updateLocked ? 'Locked' : 'Edit';
    editBtn.disabled = updateLocked;
    if (!updateLocked) editBtn.onclick = () => editStudent(student);
    actions.appendChild(editBtn);

    if (canUnlock) {
      const unlockBtn = document.createElement('button');
      unlockBtn.className = 'icon-btn success';
      unlockBtn.type = 'button';
      unlockBtn.textContent = 'Unlock update';
      unlockBtn.onclick = () => unlockProfileUpdate(student._id);
      actions.appendChild(unlockBtn);
    }

    if (canDelete) {
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'icon-btn danger';
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = () => deleteStudent(student._id);
      actions.appendChild(deleteBtn);
    }

    list.appendChild(row);
  });

  emptyState.classList.toggle('hidden', filtered.length !== 0);
  renderPagination(filtered.length);
}

function renderPagination(total) {
  const pages = Math.ceil(total / pageSize);
  pagination.innerHTML = '';
  if (pages <= 1) return;

  for (let page = 1; page <= pages; page += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = page;
    btn.className = page === currentPage ? 'active' : '';
    btn.onclick = () => {
      currentPage = page;
      render();
    };
    pagination.appendChild(btn);
  }
}

function editStudent(student, silent = false) {
  editingId = student._id;
  nameInput.value = student.name || '';
  studentEmail.value = currentUser?.role === 'student' ? currentUser.email : student.email || '';
  matricNumber.value = student.matricNumber || '';
  courses.value = (student.courses || []).join(', ');
  cancelBtn.classList.toggle('hidden', currentUser?.role === 'student');
  configureDashboardForRole();
  if (!silent) document.getElementById('studentForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetForm() {
  editingId = null;
  recordForm.reset();
  showMessage(studentError);
  cancelBtn.classList.add('hidden');
  if (currentUser?.role === 'student') studentEmail.value = currentUser.email;
  configureDashboardForRole();
}

async function saveStudent(event) {
  event.preventDefault();
  showMessage(studentError);

  const role = currentUser?.role;
  const existingStudentProfile = role === 'student' && allStudents[0];
  if (existingStudentProfile?.profileUpdateUsed) {
    showMessage(studentError, 'You have already used your one allowed profile update.');
    return;
  }

  const targetId = editingId || existingStudentProfile?._id;
  const method = targetId ? 'PUT' : 'POST';
  const url = targetId ? `${API_URL}/${targetId}` : API_URL;

  const body = {
    name: nameInput.value,
    email: role === 'student' ? currentUser.email : studentEmail.value,
    matricNumber: matricNumber.value,
    courses: courses.value.split(',').map((course) => course.trim()).filter(Boolean)
  };

  try {
    await apiRequest(url, {
      method,
      headers: headers(),
      body: JSON.stringify(body)
    });
    resetForm();
    await getStudents();
  } catch (error) {
    showMessage(studentError, error.message);
  }
}

async function unlockProfileUpdate(id) {
  if (!confirm('Unlock one more profile update for this student?')) return;

  try {
    await apiRequest(`${API_URL}/${id}/unlock-profile-update`, {
      method: 'POST',
      headers: headers()
    });
    if (editingId === id) resetForm();
    await getStudents();
  } catch (error) {
    showMessage(studentError, error.message);
  }
}

async function deleteStudent(id) {
  if (!confirm('Delete this student record?')) return;

  try {
    await apiRequest(`${API_URL}/${id}`, {
      method: 'DELETE',
      headers: headers()
    });
    if (editingId === id) resetForm();
    await getStudents();
  } catch (error) {
    showMessage(studentError, error.message);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[char]));
}

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  token = null;
  currentUser = null;
  allStudents = [];
  editingId = null;
  showLogin();
}

authToggle.onclick = () => setAuthMode(!isLogin);
document.querySelectorAll('input[name="role"]').forEach((input) => {
  input.onchange = updateAccessCodeVisibility;
});

logoutBtn.onclick = logout;
cancelBtn.onclick = resetForm;
searchInput.oninput = () => {
  currentPage = 1;
  render();
};
recordForm.onsubmit = saveStudent;

authForm.onsubmit = async (event) => {
  event.preventDefault();
  showMessage(authError);

  const endpoint = isLogin ? '/login' : '/register';
  const body = {
    email: email.value.trim(),
    password: password.value
  };

  if (!isLogin) {
    body.name = displayName.value.trim();
    body.role = selectedRole();
    if (requiresAccessCode(body.role)) {
      body.accessCode = accessCode.value.trim();
    }
  }

  try {
    const data = await apiRequest(AUTH_URL + endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (isLogin) {
      token = data.token;
      currentUser = data.user;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(currentUser));
      showDashboard();
      await getStudents();
    } else {
      setAuthMode(true);
      password.value = '';
      showMessage(authError, 'Account created. Sign in to continue.');
    }
  } catch (error) {
    showMessage(authError, error.message);
  }
};

(async function init() {
  setAuthMode(true);
  if (!token) {
    showLogin();
    return;
  }

  try {
    await refreshCurrentUser();
    showDashboard();
    await getStudents();
  } catch (error) {
    showMessage(authError, error.message);
    logout();
  }
})();
