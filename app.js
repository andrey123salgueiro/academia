// --- ESTADO GLOBAL & PERSISTÊNCIA (localStorage) ---
const STORAGE_WORKOUTS = 'app_workouts';
const STORAGE_LOGS = 'app_completed_logs';
const STORAGE_TARGET = 'app_weekly_target';

// Carregar dados salvos ou inicializar padrões
function getWorkouts() {
  const saved = localStorage.getItem(STORAGE_WORKOUTS);
  return saved ? JSON.parse(saved) : [
    {
      id: '1',
      name: 'Treino A - Peito e Tríceps',
      category: 'Hipertrofia',
      exercises: [
        { name: 'Supino Reto', sets: '4', reps: '10' },
        { name: 'Tríceps Pulley', sets: '3', reps: '12' }
      ]
    }
  ];
}

function saveWorkouts(workouts) {
  localStorage.setItem(STORAGE_WORKOUTS, JSON.stringify(workouts));
}

function getCompletedLogs() {
  const saved = localStorage.getItem(STORAGE_LOGS);
  return saved ? JSON.parse(saved) : [];
}

function saveCompletedLogs(logs) {
  localStorage.setItem(STORAGE_LOGS, JSON.stringify(logs));
}

function getWeeklyTarget() {
  const saved = localStorage.getItem(STORAGE_TARGET);
  return saved ? parseInt(saved, 10) : 5;
}

function saveWeeklyTarget(target) {
  localStorage.setItem(STORAGE_TARGET, target.toString());
}

// --- CÁLCULO DA FREQUÊNCIA SEMANAL DINÂMICA ---
function calculateWeeklyFrequency() {
  const completedLogs = getCompletedLogs();
  const today = new Date();
  const currentDay = today.getDay(); // 0 (Dom) a 6 (Sáb)
  
  // Início da semana atual (Domingo)
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - currentDay);
  startOfWeek.setHours(0, 0, 0, 0);

  const completedThisWeek = completedLogs.filter(dateStr => {
    const logDate = new Date(dateStr + 'T00:00:00');
    return logDate >= startOfWeek && logDate <= today;
  }).length;

  return completedThisWeek;
}

// --- LÓGICA DO PAINEL (painel.html) ---
function initPainelPage() {
  const freqCountEl = document.getElementById('freqCount');
  const freqTargetEl = document.getElementById('freqTarget');
  const progressBarEl = document.getElementById('progressBar');
  const targetInputEl = document.getElementById('targetInput');

  if (!freqCountEl) return; // Não está na página do painel

  const completed = calculateWeeklyFrequency();
  const target = getWeeklyTarget();

  freqCountEl.textContent = completed;
  freqTargetEl.textContent = target;
  if (targetInputEl) targetInputEl.value = target;

  const percentage = Math.min((completed / target) * 100, 100);
  if (progressBarEl) progressBarEl.style.width = `${percentage}%`;
}

function updateWeeklyTarget(newTarget) {
  const val = Math.max(1, parseInt(newTarget, 10) || 1);
  saveWeeklyTarget(val);
  initPainelPage();
}

function handleCheckInToday() {
  const todayStr = new Date().toISOString().split('T')[0];
  const logs = getCompletedLogs();

  if (logs.includes(todayStr)) {
    alert('Você já realizou o check-in de hoje!');
    return;
  }

  logs.push(todayStr);
  saveCompletedLogs(logs);
  alert('Treino concluído com sucesso e registrado!');
  initPainelPage();
}

// --- LÓGICA DE CRIAR TREINO (criar-treino.html) ---
function initCriarTreinoPage() {
  const container = document.getElementById('exercisesContainer');
  if (!container) return; // Não está na página de criar treino

  // Adicionar a primeira linha por padrão se estiver vazio
  if (container.children.length === 0) {
    addExerciseRow();
  }
}

function addExerciseRow() {
  const container = document.getElementById('exercisesContainer');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'exercise-row';
  row.innerHTML = `
    <input type="text" placeholder="Nome do exercício" class="input-exercise-name" required />
    <input type="text" placeholder="Séries" value="3" class="input-exercise-sets" required />
    <input type="text" placeholder="Reps" value="10" class="input-exercise-reps" required />
    <button type="button" class="btn-remove" onclick="removeExerciseRow(this)">✕</button>
  `;
  container.appendChild(row);
}

function removeExerciseRow(button) {
  const container = document.getElementById('exercisesContainer');
  if (container.children.length > 1) {
    button.parentElement.remove();
  } else {
    alert('O treino deve ter pelo menos um exercício.');
  }
}

function handleSaveWorkoutForm(event) {
  event.preventDefault();

  const nameInput = document.getElementById('workoutName');
  const categoryInput = document.getElementById('workoutCategory');
  const exerciseRows = document.querySelectorAll('.exercise-row');

  const name = nameInput.value.trim();
  const category = categoryInput.value;

  if (!name) {
    alert('Informe o nome do treino.');
    return;
  }

  const exercises = [];
  exerciseRows.forEach(row => {
    const exName = row.querySelector('.input-exercise-name').value.trim();
    const exSets = row.querySelector('.input-exercise-sets').value.trim();
    const exReps = row.querySelector('.input-exercise-reps').value.trim();

    if (exName) {
      exercises.push({ name: exName, sets: exSets, reps: exReps });
    }
  });

  if (exercises.length === 0) {
    alert('Adicione pelo menos um exercício válido.');
    return;
  }

  const newWorkout = {
    id: Date.now().toString(),
    name: name,
    category: category,
    exercises: exercises
  };

  const workouts = getWorkouts();
  workouts.push(newWorkout);
  saveWorkouts(workouts);

  alert('Treino salvo com sucesso!');
  window.location.href = 'biblioteca.html';
}

// --- LÓGICA DA BIBLIOTECA & DOWNLOAD (biblioteca.html) ---
function initBibliotecaPage() {
  const grid = document.getElementById('workoutGrid');
  if (!grid) return; // Não está na página da biblioteca

  const workouts = getWorkouts();

  if (workouts.length === 0) {
    grid.innerHTML = `<div class="empty-state">Nenhum treino encontrado na biblioteca.</div>`;
    return;
  }

  grid.innerHTML = workouts.map(w => `
    <div class="card">
      <div class="card-header">
        <div>
          <h3>${w.name}</h3>
          <span class="badge">${w.category}</span>
        </div>
        <div class="card-actions">
          <button onclick="downloadWorkoutFile('${w.id}')" title="Baixar Ficha TXT" class="btn-icon">
            ⬇️ Baixar
          </button>
          <button onclick="deleteWorkout('${w.id}')" title="Excluir" class="btn-icon btn-danger">
            🗑️
          </button>
        </div>
      </div>
      <div class="card-body">
        <h4>EXERCÍCIOS:</h4>
        <ul>
          ${w.exercises.map(ex => `
            <li>
              <span>${ex.name}</span>
              <strong>${ex.sets}x${ex.reps}</strong>
            </li>
          `).join('')}
        </ul>
      </div>
    </div>
  `).join('');
}

function downloadWorkoutFile(id) {
  const workouts = getWorkouts();
  const workout = workouts.find(w => w.id === id);

  if (!workout) {
    alert('Treino não encontrado.');
    return;
  }

  let textContent = `=====================================\n`;
  textContent += `FICHA DE TREINO: ${workout.name.toUpperCase()}\n`;
  textContent += `Categoria: ${workout.category}\n`;
  textContent += `Data de Exportação: ${new Date().toLocaleDateString('pt-BR')}\n`;
  textContent += `=====================================\n\n`;
  textContent += `EXERCÍCIOS:\n\n`;

  workout.exercises.forEach((ex, index) => {
    textContent += `${index + 1}. ${ex.name}\n`;
    textContent += `   Séries: ${ex.sets} | Repetições: ${ex.reps}\n`;
    textContent += `-------------------------------------\n`;
  });

  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${workout.name.toLowerCase().replace(/\s+/g, '_')}_ficha.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function deleteWorkout(id) {
  if (!confirm('Deseja realmente remover este treino?')) return;
  const workouts = getWorkouts().filter(w => w.id !== id);
  saveWorkouts(workouts);
  initBibliotecaPage();
}

// --- INICIALIZAÇÃO AUTO-DETECTÁVEL DA PÁGINA ---
document.addEventListener('DOMContentLoaded', () => {
  initPainelPage();
  initCriarTreinoPage();
  initBibliotecaPage();
});
