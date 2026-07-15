
class ColumnFilter {

	constructor(columnName, gantt) {
		this.gantt = gantt;
		this.columnName = columnName;
		this.value = "";
		this.filter = () => true;
		this.subscribers = [];
	}

	init() {
		// input logic for header element of the filter
	}

	subscribe(subscriber) {
		this.subscribers.push(subscriber);
	}
	notify() {
		this.subscribers.forEach((s) => s.onFilterChange(this));
	}

	setValue() { }
	getLabelHTML() { }
	fillLabelValues() { }

}

class TextFilter extends ColumnFilter {
	init() {
		// handler for text filters
		this.gantt.$container.addEventListener("input", (e) => {
			const textFilter = e.target.closest(`[data-column-name="${this.columnName}"] [data-text-filter]`);
			if (textFilter) {
				//Ashok.Gogu - Passing column Name as paramter
				var vColumn_name = this.columnName;
				this.setValue({ value: textFilter.value }, vColumn_name);
				setTimeout(() => {
					this._getNode().focus();
				})
			}
		});
	}
	_getNode() {
		return this.gantt.$container.querySelector(`[data-column-name="${this.columnName}"] [data-text-filter]`);
	}
	getLabelHTML() {
		return `<input data-text-filter="${this.columnName}" type='text' placeholder='Filter ...'>`;
	}
	setValue(state, attribute) {
		this.value = state.value;
		//this.filter = task => task.text.toLowerCase().includes(this.value.toLowerCase());
		//Ashok.Gogu
		this.filter = task => {
			const attributeValue = task[attribute];
			// Check if attributeValue is a string before calling toLowerCase()
			if (typeof attributeValue === 'string') {
				// Convert both attributeValue and this.value to lowercase before checking inclusion
				return attributeValue.toLowerCase().includes(this.value.toLowerCase());
			} else {
				// Handle non-string attribute values (e.g., null, undefined, numbers, etc.)
				return false; // or any other appropriate action based on your requirements
			}
		};
		this.notify();
	}
	fillLabelValues() {
		this._getNode().outerHTML = this.getLabelHTML();
		this._getNode().value = this.value;
	}
}

class DateFilter extends ColumnFilter {
	constructor(columnName, gantt) {
		super(columnName, gantt);
		this.date = ""; // To store the selected date
		this.condition = "after"; // To store the selected condition ('before', 'after', 'equals')
		this.popup = null;
	}

	init() {
		// Event delegation to handle clicks for opening the date filter popup
		this.gantt.$container.addEventListener("click", (e) => {
			const dateFilterIcon = e.target.closest(`[data-column-name="${this.columnName}"] .date-filter-value`);
			if (dateFilterIcon) {
				this.showPopup(dateFilterIcon);
				return;
			}

			const resetIcon = e.target.closest(`[data-column-name="${this.columnName}"] .reset-filter-icon`);
			if (resetIcon) {
				this.setValue({
					value: "",
					condition: this.condition
				});
				this.hidePopup();
				return;
			}

			if (this.popup && !this.popup.contains(e.target)) {
				this.hidePopup();
			}
		});

	}

	_createPopup() {
		const popup = document.createElement("div");
		popup.className = "date-filter-popup";
		popup.innerHTML = `
				<input type="date" class="date-filter-input" />
				<select class="date-filter-select">
					<option value="equals">Equals</option>
					<option value="before">Before</option>
					<option value="after">After</option>
				</select>
				<button type="button" class="date-filter-apply">Apply</button>
			`;
		return popup;
	}

	showPopup(targetElement) {
		if (!this.popup) {
			this.popup = this._createPopup();
		}
		const popup = this.popup;
		document.body.appendChild(popup);

		const rect = targetElement.getBoundingClientRect();
		popup.style.display = 'block';
		popup.style.left = `${rect.left}px`;
		popup.style.top = `${rect.bottom}px`;


		popup.querySelector(".date-filter-input").value = this.value;
		popup.querySelector(".date-filter-select").value = this.condition;

		popup.querySelector(".date-filter-apply").onclick = () => {
			this.setValue({
				value: popup.querySelector(".date-filter-input").value,
				condition: popup.querySelector(".date-filter-select").value
			});
			this.hidePopup();
		}
	}

	hidePopup() {
		if (this.popup) {
			this.popup.remove();
			this.popup = null;
		}
	}

	setValue({ value, condition }) {
		this.value = value;
		this.condition = condition || this.condition || "after";
		this.filter = task => {
			if (!this.value) return true;
			const taskDate = DateFilter.parseDate(task[this.columnName]);
			const filterDate = DateFilter.parseDate(this.value);
			if (!taskDate || !filterDate) return false;
			switch (this.condition) {
				case 'before': return taskDate < filterDate;
				case 'after': return taskDate > filterDate;
				case 'equals': return taskDate.getTime() === filterDate.getTime();
				default: return true;
			}
		};
		this.notify();
	}

	// Parse dates as local calendar days. The grid displays dd-mm-yyyy values,
	// while the native date input supplies yyyy-mm-dd; Date.parse is unreliable
	// for the former and treats the latter as UTC in many browsers.
	static parseDate(value) {
		if (value instanceof Date) {
			if (isNaN(value.getTime())) return null;
			return new Date(value.getFullYear(), value.getMonth(), value.getDate());
		}

		if (value === null || value === undefined || value === "") return null;
		const text = String(value).trim();
		let match = /^(\d{4})[-\/]([0-1]?\d)[-\/]([0-3]?\d)(?:[T\s].*)?$/.exec(text);
		let year, month, day;
		if (match) {
			year = Number(match[1]);
			month = Number(match[2]);
			day = Number(match[3]);
		} else {
			match = /^([0-3]?\d)[-\/]([0-1]?\d)[-\/](\d{4})(?:[T\s].*)?$/.exec(text);
			if (!match) return null;
			day = Number(match[1]);
			month = Number(match[2]);
			year = Number(match[3]);
		}

		const parsed = new Date(year, month - 1, day);
		if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day) {
			return null;
		}
		return parsed;
	}


	_filterHeaderContent() {
		let displayValue = "";

		if (this.value) {
			let sign = "=";
			switch (this.condition) {
				case 'equals': sign = "="; break;
				case 'before': sign = "&lt;"; break;
				case 'after': sign = "&gt;"; break;
				default: sign = "=";
			}
			displayValue = `${sign} ${this.value}`;
		} else {
			displayValue = "Click to Filter"
		}

		return `<div data-date-filter>
<div class="filter-icon-container">
	<button class="date-filter-value">${displayValue}</button>
	<button class="reset-filter-icon">Clear</button>
</div>

</div>
`
	}

	getLabelHTML() {

		return `
${this._filterHeaderContent()}

`
	}

	fillLabelValues() {
		this.gantt.$container.querySelector(`[data-column-name="${this.columnName}"] [data-date-filter]`).outerHTML = this.getLabelHTML();
	}
}

class FilterManager {
	constructor(gantt) {
		
		if (!FilterManager.instance) {
            // If instance doesn't exist, create it
				
		    this.gantt = gantt;
		    this.filters = [];
            FilterManager.instance = this;
        }else {
			FilterManager.instance.filters = [];
		}
        // Return the singleton instance
        return FilterManager.instance;
	
	}

	addFilter(filter) {
		this.filters.push(filter);

		filter.subscribe(this);
	}

	onFilterChange() {
		this.applyFilters();
	}

	applyFilters() {
		this.gantt.render();
	}

	restoreFilters() {
		this.filters.forEach(filter => filter.fillLabelValues());
	}

	init() {
		//this.gantt.attachEvent("onGanttReady", () => {
		//	this.filters.forEach(filter => filter.init());
		//}, { once: true });
		// Attach an event to Gantt to restore filter states after render
		//this.gantt.attachEvent("onGanttRender", () => this.restoreFilters());
		//this.gantt.attachEvent("onBeforeTaskDisplay", (id, task) => this.filters.every(filter => filter.filter(task)));
		
		
		
		// Define the event handler function
		function onGanttReady() {
			 
			// Iterate over each filter in the filters array
			for (let i = 0; i < this.filters.length; i++) {
				// Get the current filter
				let filter = this.filters[i];
				// Call the init method on the current filter
				filter.init();
			}
		}

		// Attach the event handler to the 'onGanttReady' event
		// with the { once: true } option to ensure it runs only once
		this.gantt.attachEvent("onGanttReady", onGanttReady.bind(this), { once: true });

		
		// Define the event handler function
		function onGanttRender() {
			// Call the restoreFilters method on the current object
			 
			this.restoreFilters();
		}

		// Attach the event handler to the 'onGanttRender' event
		this.gantt.attachEvent("onGanttRender", onGanttRender.bind(this));

		
		// Define the event handler function
		function onBeforeTaskDisplay(id, task) {
			// Iterate over each filter in the filters array
			for (let i = 0; i < this.filters.length; i++) {
				// Get the current filter
				let filter = this.filters[i];
				// Apply the filter function to the task
				if (!filter.filter(task)) {
					// If the filter function returns false, the task should not be displayed
					return false;
				}
			}
			// If all filter functions return true, the task should be displayed
			return true;
		}

		// Attach the event handler to the 'onBeforeTaskDisplay' event
		this.gantt.attachEvent("onBeforeTaskDisplay", onBeforeTaskDisplay.bind(this));

	}
}
