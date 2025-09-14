/*
  --------------------------------------------------------------------------------------
  Constante com a URL base da API (Flask backend)
  --------------------------------------------------------------------------------------
*/
const API_BASE = "http://127.0.0.1:5000";

/*
  --------------------------------------------------------------------------------------
  Funções utilitárias para seleção de elementos do DOM
  --------------------------------------------------------------------------------------
*/
const $ = (sel, el = document) => el.querySelector(sel);
const $$ = (sel, el = document) => Array.from(el.querySelectorAll(sel));

/*
  --------------------------------------------------------------------------------------
  Função para formatar datas no padrão YYYY-MM-DD
  --------------------------------------------------------------------------------------
*/
function fmtDateYYYYMMDD(d) {
  d = d || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/*
  --------------------------------------------------------------------------------------
  Função utilitária para criar elementos HTML dinamicamente
  --------------------------------------------------------------------------------------
*/
function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  Object.entries(attrs).forEach(([k, v]) => {
    if (k === "class") node.className = v;
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.substring(2), v);
    else node.setAttribute(k, v);
  });
  (Array.isArray(children) ? children : [children]).forEach(c => {
    if (c == null) return;
    if (typeof c === "string") node.appendChild(document.createTextNode(c));
    else node.appendChild(c);
  });
  return node;
}

let FOODS = [];
let currentDate = fmtDateYYYYMMDD();

// ====== API calls ======

/*
  --------------------------------------------------------------------------------------
  Função para realizar requisições GET
  --------------------------------------------------------------------------------------
*/
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json();
}

/*
  --------------------------------------------------------------------------------------
  Função para realizar requisições POST
  --------------------------------------------------------------------------------------
*/
async function apiPost(path, data) {
  const res = await fetch(API_BASE + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {})
  });
  if (!res.ok) throw new Error(`POST ${path} -> ${res.status}`);
  return res.json();
}

/*
  --------------------------------------------------------------------------------------
  Função para buscar todos os alimentos da API
  --------------------------------------------------------------------------------------
*/
async function fetchFoods(force=false) {
  if (!force && FOODS.length) return FOODS;
  FOODS = await apiGet("/foods");
  return FOODS;
}

/*
  --------------------------------------------------------------------------------------
  Função para buscar refeições de um dia específico
  --------------------------------------------------------------------------------------
*/
async function fetchMealsFor(dayStr) {
  return apiGet(`/meals?date=${encodeURIComponent(dayStr)}`);
}

/*
  --------------------------------------------------------------------------------------
  Função para buscar o total de calorias de um dia específico
  --------------------------------------------------------------------------------------
*/
async function fetchTotalFor(dayStr) {
  return apiGet(`/total?date=${encodeURIComponent(dayStr)}`);
}

/*
  --------------------------------------------------------------------------------------
  Função para criar uma nova refeição via API
  --------------------------------------------------------------------------------------
*/
async function createMeal(dayStr, mealType, items) {
  return apiPost("/meals", { day: dayStr, meal_type: mealType, items });
}

/*
  --------------------------------------------------------------------------------------
  Função para gravar um novo alimento via API
  --------------------------------------------------------------------------------------
*/
async function createFood(name, amount, unit, calories) {
  return apiPost("/foods", { name: name, amount: amount, unit: unit, calories: calories });
}

/*
  --------------------------------------------------------------------------------------
  Função para adicionar um item a uma refeição existente via API
  --------------------------------------------------------------------------------------
*/
async function addItemToMeal(mealId, foodId, quantity) {
  return apiPost(`/meals/${mealId}/items`, { food_id: foodId, quantity });
}

// ====== Rendering ======
/*
  --------------------------------------------------------------------------------------
  Função para renderizar o total de calorias na tela
  --------------------------------------------------------------------------------------
*/
function renderTotal(totalData) {
  $("#totalCalories").textContent = (totalData.total_calories ?? 0).toFixed(1);
}

/*
  --------------------------------------------------------------------------------------
  Função para renderizar as refeições na tela e ir adicionando elas como tabela
  --------------------------------------------------------------------------------------
*/
function renderMeals(meals) {
  const list = $("#mealsList");
  list.innerHTML = "";
  $("#emptyState").style.display = meals.length ? "none" : "block";

  meals.forEach(m => {
    const header = el("div", { class: "meal-card__header" }, [
      el("div", { class: "meal-type" }, `${m.meal_type} — ${m.day}`),
      el("div", { class: "meal-cal" }, `${(m.total_calories || 0).toFixed(1)} kcal`)
    ]);

    const table = el("table", {}, [
      el("thead", {}, el("tr", {}, [
        el("th", {}, "Alimento"),
        el("th", { class: "qty" }, "Qtd"),
        el("th", { class: "kcal" }, "kcal")
      ])),
      el("tbody", {}, (m.items || []).map(i =>
        el("tr", {}, [
          el("td", {}, i.food ? i.food.name : "—"),
          el("td", { class: "qty" }, String(i.quantity)),
          el("td", { class: "kcal" }, (i.calories || 0).toFixed(1))
        ])
      ))
    ]);

    // mini form para adicionar item a esta refeição
    const addItemFoodSelect = el("select", { class: "foodSelect" });
    FOODS.forEach(f => {
      addItemFoodSelect.appendChild(el("option", { value: f.id }, `${f.name} (${f.amount}${f.unit})`));
    });
    const qtyInput = el("input", { type: "number", step: "0.1", min: "0", value: "1", class: "qtyInput" });
    const addItemBtn = el("button", { class: "ghost", onclick: async () => {
      try {
        const foodId = Number(addItemFoodSelect.value);
        const qty = Number(qtyInput.value || "1");
        await addItemToMeal(m.id, foodId, qty);
        await loadDay(currentDate);
      } catch (e) { console.error(e); }
    }}, "Adicionar item");

    const actions = el("div", { class: "meal-card__actions" }, [
      addItemFoodSelect, qtyInput, addItemBtn
    ]);

    const card = el("article", { class: "meal-card" }, [
      header,
      el("div", { class: "meal-items" }, table),
      actions
    ]);

    list.appendChild(card);
  });
}

// ====== Modal: criar refeição ======

/*
  --------------------------------------------------------------------------------------
  Função para abrir o modal de criação de refeição
  --------------------------------------------------------------------------------------
*/
function openMealModal() { $("#mealModal").setAttribute("aria-hidden", "false"); }

/*
  --------------------------------------------------------------------------------------
  Função para fechar o modal de criação de refeição
  --------------------------------------------------------------------------------------
*/
function closeMealModal() { $("#mealModal").setAttribute("aria-hidden", "true"); }

/*
  --------------------------------------------------------------------------------------
  Função para abrir o modal de alimento
  --------------------------------------------------------------------------------------
*/
function openFoodModal() { $("#foodModal").setAttribute("aria-hidden", "false"); }

/*
  --------------------------------------------------------------------------------------
  Função para fechar o modal de alimento  
  --------------------------------------------------------------------------------------
*/
function closeFoodModal() { $("#foodModal").setAttribute("aria-hidden", "true"); }

/*
  --------------------------------------------------------------------------------------
  Função para criar uma linha de item no formulário do modal
  --------------------------------------------------------------------------------------
*/
function createItemRow() {
  const tpl = $("#itemRowTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);

  const foodSelect = $(".foodSelect", node);
  FOODS.forEach(f => {
    foodSelect.appendChild(el("option", { value: f.id }, `${f.name} (${f.amount}${f.unit})`));
  });

  const qtyInput = $(".qtyInput", node);
  const unitHint = $(".unitHint", node);

  function updateHint() {
    const f = FOODS.find(x => String(x.id) === foodSelect.value);
    unitHint.textContent = f ? `× ${f.amount}${f.unit}` : "";
  }
  foodSelect.addEventListener("change", updateHint);
  updateHint();

  $(".removeRowBtn", node).addEventListener("click", () => node.remove());
  return node;
}


/*
  --------------------------------------------------------------------------------------
  Função para configurar eventos do modal de criação de refeição
  --------------------------------------------------------------------------------------
*/
function setupMealModal() {
  $("#addMealBtn").addEventListener("click", () => {
    $("#itemsContainer").innerHTML = "";
    $("#itemsContainer").appendChild(createItemRow());
    openMealModal();
  });
  $("#closeMealModal").addEventListener("click", closeMealModal);
  $("#addItemRowBtn").addEventListener("click", () => {
    $("#itemsContainer").appendChild(createItemRow());
  });

  $("#mealForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const mealType = $("#mealType").value;
    const items = $$("#itemsContainer .item-row").map(row => {
      const foodId = Number($(".foodSelect", row).value);
      const quantity = Number($(".qtyInput", row).value || "1");
      return { food_id: foodId, quantity };
    });

    try {
      await createMeal(currentDate, mealType, items);
      closeMealModal();
      await loadDay(currentDate);
    } catch (err) {
      console.error(err);
    }
  });
}

/*
  --------------------------------------------------------------------------------------
  Função para configurar eventos do modal de criação de alimento
  --------------------------------------------------------------------------------------
*/
function setupFoodModal() {
  $("#addFoodBtn").addEventListener("click", openFoodModal);
  $("#closeFoodModal").addEventListener("click", closeFoodModal);
  $("#foodForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = $("#foodName").value;
    const amount = $("#foodAmount").value;
    const unit = $("#foodUnit").value;
    const calories = $("#foodCalories").value;

    try {
      await createFood(name, amount, unit, calories);
      closeFoodModal();
    } catch (err) {
      console.error(err);
    }
  });
}

/*
  --------------------------------------------------------------------------------------
  Função para carregar os dados de um dia específico
  --------------------------------------------------------------------------------------
*/
async function loadDay(dayStr) {
  currentDate = dayStr;
  $("#dateInput").value = dayStr;

  // Carrega alimentos apenas uma vez
  await fetchFoods();

  // Carregar refeições + total
  const [meals, total] = await Promise.all([
    fetchMealsFor(dayStr),
    fetchTotalFor(dayStr)
  ]);

  renderMeals(meals);
  renderTotal(total);
}

/*
  --------------------------------------------------------------------------------------
  Função para configurar os controles de navegação de datas
  --------------------------------------------------------------------------------------
*/
function setupDateControls() {
  const input = $("#dateInput");
  input.value = fmtDateYYYYMMDD();

  $("#prevDayBtn").addEventListener("click", () => {
    const d = new Date(input.value || fmtDateYYYYMMDD());
    d.setDate(d.getDate() - 1);
    loadDay(fmtDateYYYYMMDD(d));
  });

  $("#nextDayBtn").addEventListener("click", () => {
    const d = new Date(input.value || fmtDateYYYYMMDD());
    d.setDate(d.getDate() + 1);
    loadDay(fmtDateYYYYMMDD(d));
  });

  input.addEventListener("change", () => {
    loadDay(input.value || fmtDateYYYYMMDD());
  });
}

/*
  --------------------------------------------------------------------------------------
  Função principal de inicialização da aplicação
  --------------------------------------------------------------------------------------
*/
document.addEventListener("DOMContentLoaded", async () => {
  setupDateControls();
  setupMealModal();
  setupFoodModal()
  await loadDay(fmtDateYYYYMMDD());
});
