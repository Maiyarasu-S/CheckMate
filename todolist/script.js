document.addEventListener("DOMContentLoaded", () => {
  const addListBtn = document.getElementById("addListBtn");
  const todoLists = document.getElementById("todoLists");
  const todoContent = document.getElementById("todoContent");
  const openAddTodo = document.getElementById("openAddTodo");
  const addTodoBtn = document.getElementById("addTodoBtn");
  const sortBtn = document.querySelector(".sort-btn");

  let currentList = null;
  let todosPerList = {};
  let completedTodos = {};
  let editingTodoIndex = null;
  let currentSort = "none"; // Track current sort

  const addTodoModalEl = document.getElementById("addTodoModal");
  const addTodoModal = new bootstrap.Modal(addTodoModalEl);

  // Load from localStorage
  const savedTodos = localStorage.getItem("todosPerList");
  const savedCompleted = localStorage.getItem("completedTodos");
  if (savedTodos) todosPerList = JSON.parse(savedTodos);
  if (savedCompleted) completedTodos = JSON.parse(savedCompleted);

  // --- LIST CREATION & RENDER ---
  const renderLists = () => {
    todoLists.innerHTML = "";
    Object.keys(todosPerList).forEach(listName => {
      createListElement(listName);
    });

    const firstList = Object.keys(todosPerList)[0];
    if (firstList && !currentList) {
      currentList = firstList;
      const firstLink = todoLists.querySelector(".nav-link");
      if (firstLink) firstLink.classList.add("active");
      renderTodos();
    }
  };

  const createListElement = (listName) => {
    const newList = document.createElement("a");
    newList.classList.add("nav-link");
    newList.href = "#";

    const textSpan = document.createElement("span");
    textSpan.textContent = listName;

    const renameIcon = document.createElement("span");
    renameIcon.classList.add("rename-list");
    renameIcon.innerHTML = "&#9998;";

    const deleteIcon = document.createElement("span");
    deleteIcon.classList.add("delete-list");
    deleteIcon.innerHTML = "&times;";

    const iconContainer = document.createElement("span");
    iconContainer.classList.add("icon-container");
    iconContainer.appendChild(renameIcon);
    iconContainer.appendChild(deleteIcon);

    newList.appendChild(textSpan);
    newList.appendChild(iconContainer);

    newList.addEventListener("click", (e) => {
      if (e.target === deleteIcon || e.target === renameIcon) return;
      document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
      newList.classList.add("active");
      currentList = listName;
      renderTodos();
    });

    deleteIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      if (confirm(`Delete "${listName}"?`)) {
        delete todosPerList[listName];
        delete completedTodos[listName];
        localStorage.setItem("todosPerList", JSON.stringify(todosPerList));
        localStorage.setItem("completedTodos", JSON.stringify(completedTodos));
        renderLists();
        todoContent.innerHTML = `<p class="text-center text-white mt-5">Select a list or create one to start</p>`;
        currentList = null;
      }
    });

    renameIcon.addEventListener("click", (e) => {
      e.stopPropagation();
      const input = document.createElement("input");
      input.type = "text";
      input.value = listName;
      input.classList.add("form-control", "form-control-sm");
      input.style.width = "120px";
      input.style.display = "inline-block";

      newList.replaceChild(input, textSpan);
      input.focus();

      const saveName = () => {
        const newName = input.value.trim() || listName;
        todosPerList[newName] = todosPerList[listName];
        completedTodos[newName] = completedTodos[listName];
        if (newName !== listName) {
          delete todosPerList[listName];
          delete completedTodos[listName];
        }
        listName = newName;
        textSpan.textContent = listName;
        newList.replaceChild(textSpan, input);
        localStorage.setItem("todosPerList", JSON.stringify(todosPerList));
        localStorage.setItem("completedTodos", JSON.stringify(completedTodos));
        if (currentList === listName) currentList = listName;
      };

      input.addEventListener("blur", saveName);
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") input.blur();
      });
    });

    todoLists.appendChild(newList);
  };

  // --- RENDER TODOS ---
  const renderTodos = () => {
    if (!currentList || !todosPerList[currentList]?.length) {
      todoContent.innerHTML = `<p class="text-center text-white mt-5">Your task list is empty 😴</p>`;
      return;
    }

    let todos = [...todosPerList[currentList]];

    // --- SORT TODOS ---
    if (currentSort === "date") {
      todos.sort((a, b) => {
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
      });
    } else if (currentSort === "priority") {
      const priorityOrder = { high: 1, mid: 2, low: 3 };
      todos.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
    }

    todoContent.innerHTML = "";
    todos.forEach((todo, index) => {
      const todoDiv = document.createElement("div");
      todoDiv.classList.add("todo-item");

      let badgeClass = "";
      if (todo.priority === "high") badgeClass = "badge-priority-high";
      else if (todo.priority === "mid") badgeClass = "badge-priority-mid";
      else badgeClass = "badge-priority-low";

      const checkboxSpan = document.createElement("span");
      checkboxSpan.classList.add("complete-checkbox");
      if (completedTodos[currentList]?.includes(index)) {
        todoDiv.classList.add("completed");
        checkboxSpan.style.backgroundColor = "#f2c86b";
        checkboxSpan.innerHTML = "✔";
      }

      const contentDiv = document.createElement("div");
      contentDiv.classList.add("todo-item-content");

      contentDiv.innerHTML = `
        <div>
          <h6>${todo.title}</h6>
          <p class="mb-0">
            ${todo.startDate ? "From: " + todo.startDate : ""} 
            ${todo.endDate ? "To: " + todo.endDate : ""}
            ${todo.tags?.length ? "| Tags: " + todo.tags.join(", ") : ""}
          </p>
        </div>
        <span class="${badgeClass}">${todo.priority}</span>
      `;

      todoDiv.appendChild(checkboxSpan);
      todoDiv.appendChild(contentDiv);

      checkboxSpan.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!completedTodos[currentList]) completedTodos[currentList] = [];
        const idx = completedTodos[currentList].indexOf(index);

        if (idx === -1) {
          completedTodos[currentList].push(index);
          todoDiv.classList.add("completed");
          checkboxSpan.innerHTML = "✔";
        } else {
          completedTodos[currentList].splice(idx, 1);
          todoDiv.classList.remove("completed");
          checkboxSpan.innerHTML = "";
        }
        localStorage.setItem("completedTodos", JSON.stringify(completedTodos));
      });

      contentDiv.addEventListener("click", () => {
        editingTodoIndex = index;
        document.getElementById("todoTitle").value = todo.title;
        document.getElementById("startDate").value = todo.startDate;
        document.getElementById("endDate").value = todo.endDate;
        document.getElementById("todoTags").value = todo.tags.join(", ");
        document.querySelector(`input[name="priority"][value="${todo.priority}"]`).checked = true;
        addTodoModal.show();
      });

      todoContent.appendChild(todoDiv);
    });
  };

  // --- ADD NEW LIST ---
  addListBtn.addEventListener("click", () => {
    let listName = "New List";
    let counter = 1;
    while (todosPerList[listName]) {
      listName = `New List ${counter++}`;
    }
    todosPerList[listName] = [];
    completedTodos[listName] = [];
    localStorage.setItem("todosPerList", JSON.stringify(todosPerList));
    localStorage.setItem("completedTodos", JSON.stringify(completedTodos));
    createListElement(listName);

    document.querySelectorAll(".nav-link").forEach(link => link.classList.remove("active"));
    todoLists.lastChild.classList.add("active");
    currentList = listName;
    renderTodos();
  });

  // --- ADD TODO MODAL ---
  openAddTodo.addEventListener("click", () => {
    if (!currentList) {
      alert("Please create or select a list first!");
      return;
    }
    editingTodoIndex = null;
    addTodoModal.show();
  });

  addTodoBtn.addEventListener("click", () => {
    const title = document.getElementById("todoTitle").value.trim();
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const priority = document.querySelector('input[name="priority"]:checked')?.value || "low";
    const tagsInput = document.getElementById("todoTags").value.trim();
    const tags = tagsInput ? tagsInput.split(",").map(tag => tag.trim()) : [];

    if (!title) {
      alert("Todo title cannot be empty!");
      return;
    }

    const newTodo = { title, startDate, endDate, priority, tags };

    if (editingTodoIndex !== null) {
      todosPerList[currentList][editingTodoIndex] = newTodo;
      editingTodoIndex = null;
    } else {
      todosPerList[currentList].push(newTodo);
    }

    localStorage.setItem("todosPerList", JSON.stringify(todosPerList));
    renderTodos();

    document.getElementById("todoTitle").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("todoTags").value = "";
    document.querySelector('input[name="priority"][value="low"]').checked = true;

    addTodoModal.hide();
  });

  // --- SORT DROPDOWN ---
  sortBtn.addEventListener("click", () => {
    let dropdown = document.createElement("div");
    dropdown.classList.add("sort-dropdown");
    dropdown.style.position = "absolute";
    dropdown.style.backgroundColor = "#222";
    dropdown.style.border = "1px solid #555";
    dropdown.style.borderRadius = "6px";
    dropdown.style.padding = "8px 0";
    dropdown.style.marginTop = "5px";
    dropdown.style.minWidth = "120px";
    dropdown.style.zIndex = "1000";

    const options = ["None", "Date", "Priority"];
    options.forEach(opt => {
      const item = document.createElement("div");
      item.textContent = opt;
      item.style.padding = "6px 12px";
      item.style.cursor = "pointer";
      item.style.color = "#fff";
      item.addEventListener("click", () => {
        currentSort = opt.toLowerCase();
        renderTodos();
        dropdown.remove();
      });
      item.addEventListener("mouseenter", () => item.style.backgroundColor = "#333");
      item.addEventListener("mouseleave", () => item.style.backgroundColor = "transparent");
      dropdown.appendChild(item);
    });

    // Remove any existing dropdown
    document.querySelectorAll(".sort-dropdown").forEach(d => d.remove());

    // Append below sort button
    sortBtn.parentElement.appendChild(dropdown);
  });

  // --- INITIAL RENDER ---
  renderLists();
});
