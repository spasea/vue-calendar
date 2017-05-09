var helpers = {
	isPhone: false
};

Vue.component('calendar', {
	'template': `
		<div style="margin-left: 200px;">
			<select v-model="selectedMonth" @change="changeMonth">
				<option 
					v-for="(month, index) in monthsStandalone"
					:value="index"
				>{{ month }}</option>
			</select>
			<select v-model="selectedYear" @change="changeYear">
				<option 
					v-for="year in calendarYears" 
				>{{ year }}</option>
			</select>
			<ul :class="calendarNsp">
				<li v-for="calendarItem in calendarItems" 
					:class="{
						'day': true, 
						'day--in-scope': calendarItem.isActive, 
						'day--is-today': calendarItem.isToday, 
						'day--out-scope': ! calendarItem.isActive,
						'day--has-events': calendarItem.hasEvents && calendarItem.isActive,
					}"
				>
					<span 
						v-text="calendarItem.val"
						@mouseover="mouseOver(calendarItem.d, calendarItem.isActive)"
						@mouseleave="dayHoverModalHide"
						@click="dayClick(this.event, calendarItem.d, calendarItem.isActive)"
					></span>
				</li>
				<div :class="modalNsp" 
					v-show="isVisible" 
					@mouseleave="modalHoverHide"
					@mouseover="mouseOnModal"
				>
					<div
						v-text="modalText"
					>
					</div>
					<div v-for="event in calendarEvents">
						<div
							v-text="event.title"
						></div>
						<div
							v-text="event.city"
						></div>
					</div>
				</div>
			</ul>
		</div>
	`,

	data() {
		return {
			// calendar settings
			calendarNsp: 'calendar',

			calendarItems: [],
			calendarYears: [],
			calendarEvents: [],

			dateStr: '',
			format: 'DD/M/YYYY',
			today: moment(),

			monthsFormat: this.monthsnames.format.split('_'),
			monthsStandalone: this.monthsnames.standalone.split('_'),

			selectedMonth: moment().format('M') - 1,
			selectedYear: moment().format('YYYY'),

			// modal settings
			modalNsp: 'calendar__modal',
			isVisible: false,
			modalTimeout: '',
			modalTimeoutTime: 400,
			dayTimeout: '',
			dayTimeoutTime: 400,
			selectedDay: ''
			
		};
	},

	computed: {
		modalText: function () {
			return `${this.selectedDay} ${this.monthsFormat[this.selectedMonth]} ${this.selectedYear}`;
		}
	},

	props: [
		'events',
		'monthsnames'
	],

	methods: {
        moment() {
            return moment(this.dateStr, this.format);
        },
		fillDays() {
			let dayStart = 1;
			if (this.moment().startOf('month').day() === 0) {
				dayStart = -6;
			}
            let start = this.moment().startOf('month').day(dayStart),
                end = this.moment().endOf('month').day(7),
                month = this.moment().month(),
                events = this.events,
                self = this;
            this.calendarItems = [];

            this.moment()
                .range(start, end)
                .by('days', function(day) {
                    self.calendarItems.push({
                        val: day.format('D'),
                        d: day.format(self.format),
                        isActive: day.month() === month,
                        isToday: day.format(self.format) === self.today.format(self.format),
                        hasEvents: day.format(self.format) in events,
                    });
                })
        },
        fillYears() {
            let start = this.moment().subtract(4, 'years'),
                end = this.moment().add(4, 'years'),
	            self = this;
            this.calendarYears = [];

            this.moment()
                .range(start, end)
                .by('years', function(year) {
                    self.calendarYears.push(
                        year.format('YYYY')
                    );
                })
        },
        changeMonth() {
			this.dateStr = moment(this.dateStr, this.format).month(this.selectedMonth).format(this.format);
        },
        changeYear() {
			this.dateStr = moment(this.dateStr, this.format).year(this.selectedYear).format(this.format);
        },

        // Timeouts

        replaceDayTimeout() {
        	clearTimeout(this.dayTimeout);
        },
        replaceModalTimeout() {
        	clearTimeout(this.modalTimeout);
        },
        setModalTimeout(time = this.modalTimeoutTime) {
        	this.replaceModalTimeout();
			this.modalTimeout = setTimeout(function () {
	    		this.isVisible = false;
	    	}.bind(this), time);
        },

        // Modal events

        // Modal hover events
        mouseOnModal() {
    		if (! helpers.isPhone) {
	        	this.replaceModalTimeout(); 
	        	this.replaceDayTimeout();
	        }
        },
        mouseOver(date, isInScope) {
        	if (! helpers.isPhone && isInScope) {
        		this.replaceDayTimeout();
        		this.dayTimeout = setTimeout(function () {
		        	this.calendarEvents = this.events[date];
		        	if (this.calendarEvents && this.calendarEvents.length) {
		        		this.replaceModalTimeout();
		        		this.selectedDay = moment(date, this.format).format('D');
		        		this.isVisible = true;
		        	}
		    	}.bind(this), this.dayTimeoutTime);
        	}
        },
        dayHoverModalHide() {
    		if (! helpers.isPhone) {
	        	this.setModalTimeout();
	        }
        },
        modalHoverHide() {
    		if (! helpers.isPhone) {
	        	this.setModalTimeout();
	        }
        },

		// Modal click events
        modalClickOutside(event) {
        	if (helpers.isPhone) {
				event.stopPropagation();
				if (! event.target.closest(`.${this.modalNsp}`)) {
					this.isVisible = false;
				}
        	}
        },
        dayClick(event, date, isInScope) {
			if (helpers.isPhone && isInScope) {
				event.stopPropagation();
	        	this.calendarEvents = this.events[date];
	        	if (this.calendarEvents && this.calendarEvents.length) {
	        		this.isVisible = true;
	        	}
        	}
        },

        // Window helper method

		getWindowWidth() {
			helpers.isPhone = document.documentElement.clientWidth < 1100;
		},
	},

	created() {
		this.dateStr = moment().format(this.format);

		this.fillDays();
		this.fillYears();
		
		this.$watch('dateStr', function () {
			this.fillDays();
        });
	},

	mounted() {
		window.addEventListener('resize', this.getWindowWidth);

		this.getWindowWidth();

		document.addEventListener('click', this.modalClickOutside);
	}

})

new Vue({
	el: '#app'
})