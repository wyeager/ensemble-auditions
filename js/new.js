// application state object that will hold audition times as they are configured
// will be written to database when 'Submit All Dates/Times' button is clicked
var newAudition = {};
var currInst;
var currDay;

$("#confDate").change( function() {
	if ($("#confDate").val() == '') {
		$("#confTimes").hide();
	} else {
		$("#confTimes").show();
	}
})

function forceConfDateChange() {
	if ($("#confDate").val() == '') {
		$("#confTimes").hide();
	} else {
		$("#confTimes").show();
	}
}

function configureNewAudition() {
	config.once('value', function(snap) {
		var configInProgress;
		if (snap.val() == null) {
			configInProgress = false;	
		} else {
			configInProgress = snap.val().configInProgress;
		}
		if (configInProgress) {
			showPage(['overview', 'edit_content', 'other'], ['conf_auditions'], 
                     ['overview_nav', 'edit_nav', 'other_nav'], ['conf_nav']);
			showPage(['conf_auditions_flow1', 'beginButton'], ['conf_auditions_flow2']);

			$('#confDate').datepicker({
				format: 'yyyy-mm-dd'
			});

			$("#instrumentsList tr").remove();

			var currentYear = snap.val().currentYear;
			auditions.child(currentYear).once('value', function(snap) {
				$.each( snap.val().instruments, function (i, inst) {
				    $('#instrumentsList').append('<tr><td><a href="#" onclick="showSetDateTime(\'' + inst + '\')">'
				     + inst + '</a></td></tr>');
				});
			});
		} else {
			showPage(['overview', 'edit_content', 'other'], ['conf_auditions'], 
                     ['overview_nav', 'edit_nav', 'other_nav'], ['conf_nav']);
		}
	});
}

function addInstrument() {
	$('#instCheckboxes').append($('<input>', { 
        type: 'checkbox',
        name: 'instrument',
        value: $('#addInst').val(),
        checked: 'checked'
    }), " " + $('#addInst').val(), $('<br>'));
 	$('#addInst').val('');
}

function configureDatesAndTimes() {
	if ($('#currYearConf').val() === '') {
		alert("Please set current year first");
		return;
	}

	$('#confDate').datepicker({
		format: 'yyyy-mm-dd'
	});

	var currentYear = $('#currYearConf').val();
	var instruments = {};
	var i = 0;
    $('#instCheckboxes :checked').each(function() {
	    instruments[i] = $(this).val();
	    $('#instrumentsList').append('<tr><td><a href="#" onclick="showSetDateTime(\'' + $(this).val() + '\')">'
				     + $(this).val() + '</a></td></tr>');
	    i++;
    });

    auditions.child(currentYear).update({
		instruments: instruments
	}).then( function () {
		//location.reload();
    }).catch( function(error) {
    	alert("Authentication error \n" + error);
    });

    config.update({
    	currentYear: currentYear,
    	configInProgress: true
    }).then( function () {
    	console.log("Success. Wrote: " + newAudition);
    }).catch( function (error) {
		alert("Authentication error \n" + error);
    })

    showPage(['conf_auditions_flow1'], ['conf_auditions_flow2']);
}

function showSetDateTime(inst) {
	$("#dateTimeHeader").text(inst);
	$("#confNumberDays").val('');
	showPage(['dateTimeMessage'], ['dateTimeInput']);
	// if (currDay != undefined) {
	// 	setDateTime(currDay); // what is going on here??
	// }
	$(".date-time-nav").remove();
	$("#generatedTimes tr").remove();

	currInst = inst;
	currDay = 1; // always show the first day when displaying a new instrument's date/times

	// show num days if it's set
	if (newAudition[currInst] != undefined && 
		newAudition[currInst]['numDays'] != undefined) {
		$("#dateTimeCard").show();
		appendDayNavs(newAudition[currInst]['numDays']);
	} else {
		$("#dateTimeCard").hide();
	}

	// show date if it's set
	if (newAudition[currInst] != undefined && 
		newAudition[currInst]['dates'] != undefined &&
		newAudition[currInst]['dates'][1] != undefined) {
		$("#confDate").val(newAudition[currInst]['dates'][1]['date']);
	} else {
		$("#confDate").val('');
	}

	forceConfDateChange();

	if (newAudition[currInst] != undefined && 
		newAudition[currInst]['dates'] != undefined &&
		newAudition[currInst]['dates'][1] != undefined &&
		newAudition[currInst]['dates'][1]['startTime'] != undefined) {
		var startTime = newAudition[currInst]['dates'][1]['startTime'];
		var timeInterval = newAudition[currInst]['dates'][1]['timeInterval'];
		var numAuditions = newAudition[currInst]['dates'][1]['numAuditions'];
		var date = newAudition[currInst]['dates'][1]['date'];
		$("#confStartTime").val(startTime);
		$("#confTimeInterval").val(timeInterval);
		$("#confNumAuditions").val(numAuditions);
		showExistingTimes(startTime, numAuditions, timeInterval, date);
	} else {
		$("#confStartTime").val('');
		$("#confTimeInterval").val('');
		$("#confNumAuditions").val('');
	}
}

function applyNumDays() {
	// should reset the num of days, dates and times for the given instrument
	console.log("In apply num days");
	var numDays = $("#confNumberDays").val();
	if (numDays <= 0 || numDays > 4) {
		alert("Sorry, the site only supports 4 (max) days per instrument audition.");
		return;
	}
	if (newAudition[currInst] == undefined) {
		newAudition[currInst] = {};
	}
	newAudition[currInst]['numDays'] = numDays;
	$(".date-time-nav").remove();

	appendDayNavs(numDays);
	currDay = 1;

	$("#dateTimeCard").show();
}

// called when day navs are clicked, when another instrument is clicked
// upNext is the index of the day tab that was just clicked
function setDateTime(upNext) {
	// get date from input, it is the date for currDay
	$("#generatedTimes tr").remove();
	var date = $("#confDate").val();

	showPage(undefined, undefined,
	 		 ['day_1_nav', 'day_2_nav', 'day_3_nav', 'day_4_nav'], ['day_' + upNext + '_nav']);
	currDay = upNext;

	// set date to what it is in the JS object after a day nav was clicked
	if (newAudition[currInst]['dates'][upNext] != undefined &&
		newAudition[currInst]['dates'][upNext]['date'] != undefined) {
		$("#confDate").val(newAudition[currInst]['dates'][upNext]['date']);
	} else {
		$("#confDate").val('');
	}

	if (newAudition[currInst]['dates'][upNext] != undefined &&
		newAudition[currInst]['dates'][upNext]['startTime'] != undefined) {
		var startTime = newAudition[currInst]['dates'][upNext]['startTime'];
		var timeInterval = newAudition[currInst]['dates'][upNext]['timeInterval'];
		var numAuditions = newAudition[currInst]['dates'][upNext]['numAuditions'];
		date = newAudition[currInst]['dates'][upNext]['date'];

		// set start time and interval to what they are in the JS object after a day nav was clicked
		$("#confStartTime").val(startTime);
		$("#confTimeInterval").val(timeInterval);
		$("#confNumAuditions").val(numAuditions);

		showExistingTimes(startTime, numAuditions, timeInterval, date);
	} else {
		$("#confStartTime").val('');
		$("#confTimeInterval").val('');
		$("#confNumAuditions").val('');
	}

	forceConfDateChange();
}

function appendDayNavs(numDays) {
	for (var i = 1; i <= numDays; i++) {
		var active = '';
		if (i == 1) {
			active = 'active';
		}
		$("#confDateTimeNav").append('<li class="nav-item date-time-nav"><a id="day_' + i + '_nav" class="nav-link '
		 + active + '" onclick="setDateTime(' + i + ')">Day ' + i + '</a></li>');
	}
}

// writes all audition instruments and times to the database
function submitNewAuditions() {
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;
		auditions.child(currentYear).update({
			// write the entire JSON object to database
			dateTimes: newAudition
		}).then( function () {
			location.reload();
	    }).catch( function(error) {
			alert("Authentication error \n" + error);
	    });

	    config.update({
	    	configInProgress: false
	    })
	});
}

function showExistingTimes(startTime, numAuditions, timeInterval, date) {
	date = date + " " + startTime;
	var momentDate = moment(date);

	for (var i = 0; i < numAuditions; i++) {
		$("#generatedTimes").append("<tr><td>" + 
			momentDate.format("dddd, MMMM Do YYYY, h:mm:ss a") + "</td></tr>");
		momentDate.add(timeInterval, 'm');
	}
}

function generateTimes() {
	var date = $("#confDate").val();
	// currInst currDay
	var startTime = $("#confStartTime").val();
	var timeInterval = $("#confTimeInterval").val();
	var numAuditions = $("#confNumAuditions").val();

	if (startTime == '' || timeInterval == '' || numAuditions == '' ||
		numAuditions <= 0 || timeInterval <= 0) {
		alert("Please fill out Start Time, Number of Auditions and Time interval " +
		      "and make sure they are greater than zero.");
		return;
	}

	var formatDate = date + " " + startTime;

	var momentDate = moment(formatDate);

	if (newAudition[currInst]['slots'] != undefined &&
		newAudition[currInst]['slots'][currDay] != undefined) {
		newAudition[currInst]['slots'][currDay] = {}; // reset times
	}
	$("#generatedTimes tr").remove(); // remove old table

	if (startTime == '' || timeInterval == '') {
		alert("Please specify a start time and a time interval");
		return;
	}

	if (newAudition[currInst] == undefined) {
		newAudition[currInst] = {};
	}

	if (newAudition[currInst]['slots'] == undefined) {
		newAudition[currInst]['slots'] = {};
	}

	if (newAudition[currInst]['dates'] == undefined) {
		newAudition[currInst]['dates'] = {};
	}

	if (newAudition[currInst]['dates'][currDay] == undefined) {
		newAudition[currInst]['dates'][currDay] = {};
	}

	newAudition[currInst]['dates'][currDay]['date'] = date;
	newAudition[currInst]['dates'][currDay]['startTime'] = startTime;
	newAudition[currInst]['dates'][currDay]['timeInterval'] = timeInterval;
	newAudition[currInst]['dates'][currDay]['numAuditions'] = numAuditions;

	if (newAudition[currInst]['slots'][currDay] == undefined) {
		newAudition[currInst]['slots'][currDay] = {};
	}

	for (var i = 0; i < numAuditions; i++) {
		newAudition[currInst]['slots'][currDay][momentDate.format("dddd, MMMM Do YYYY, h:mm:ss a")] = {};
		newAudition[currInst]['slots'][currDay][momentDate.format("dddd, MMMM Do YYYY, h:mm:ss a")]['uid'] = false;
		$("#generatedTimes").append("<tr><td>" + 
			momentDate.format("dddd, MMMM Do YYYY, h:mm:ss a") + "</td></tr>");
		momentDate.add(timeInterval, 'm');
	}
}

function backToConf1() {
	$('#instrumentsList tr').remove();
	showPage(['conf_auditions_flow2'], ['conf_auditions_flow1'])
}