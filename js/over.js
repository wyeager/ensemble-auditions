// overview admin tab logic
// displays to the admin the time slots and names of students who are currently
// signed up and which slots are still available

config.once('value', function(snap) {
	if (snap.val() != null && snap.val().configInProgress != undefined && !snap.val().configInProgress) {

		var currentYear = snap.val().currentYear;
		auditions.child(currentYear).once('value', function(snap) {
			$.each( snap.val().instruments, function (i, inst) {
			    $('#instrumentsListOverview').append('<tr><td><a href="#" onclick="showDateTimeOverview(\'' + inst + '\')">'
			     + inst + '</a></td></tr>');
			});
		});
	} else if (snap.val().configInProgress) {
		$("#dateTimeMessageOverview").text("Click Configure New Auditions to finish setting up auditions!");
	} else {
		$("#dateTimeMessageOverview").text("Click Configure New Auditions to set up a new round of auditions!");
	}
});

function showDateTimeOverview(inst) {
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;

		$("#dateTimeCardOver tr").remove();
		$("#dateTimeHeaderOverview").text(inst);
		$("#dateTimeMessageOverview").text('');


		auditions.child(currentYear + "/dateTimes/" + inst).once('value', function(auditionsSnap) {
			var dates = auditionsSnap.val().dates;
			appendDayNavsOver(auditionsSnap.val().numDays, inst, dates); // display the date, not day 1, day 2 etc

			users.child(currentYear).once('value', function(snap) {

				var slots = auditionsSnap.child('slots/1').val(); // default to 1st day
				$.each( slots, function (key, val) {
					showSlotsOver(key, val['uid'], snap);
				});
			});
		});
	});
}

function appendDayNavsOver(numDays, inst) {
	$(".overview-nav").remove();
	for ( var i = 1; i <= numDays; i++ ) {
		var active = '';
		if (i == 1) {
			active = 'active';
		}
		$("#overviewDateNav").append('<li class="nav-item overview-nav"><a id="day_' + i + '_nav_over" class="nav-link '
		 + active + '" onclick="showDayOver(' + i + ', \'' + inst + '\')">Day ' + i + '</a></li>');
	}
}

// called when a day tab is clicked for a particular instrument 
// (e.g. violins audition over the course of two days)
function showDayOver(i, inst) {
	showPage(undefined, undefined, ['day_1_nav_over', 'day_2_nav_over', 'day_3_nav_over', 'day_4_nav_over'],
		     ['day_' + i + '_nav_over']);
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;

		$("#dateTimeCardOver tr").remove();

		auditions.child(currentYear + "/dateTimes/" + inst).once('value', function(auditionsSnap) {
			users.child(currentYear).once('value', function(snap) {
				var slots = auditionsSnap.child('slots/' + i).val(); // show ith day for given inst
				$.each( slots, function (key, val) {
					showSlotsOver(key, val['uid'], snap);
				});
			});
		});
	});
}

function showSlotsOver(time, uid, names) {
	if (uid == false) {
		$("#dateTimeCardOver").append("<tr><td>" + time + "</td>" +
		                              "<td>Available</td></tr>");
	} else if (uid == "Unavailable") {
		$("#dateTimeCardOver").append("<tr><td>" + time + "</td>" + 
			                          "<td>Unavailable</td></tr>");
	} else {
		if (names.child(uid).val() != null &&
			names.child(uid).val().firstname != null &&
			names.child(uid).val().lastname != null) {
			var name = names.child(uid).val().firstname + " " + names.child(uid).val().lastname;
			$("#dateTimeCardOver").append("<tr><td>" + time + "</td>" + 
				                          "<td>" + name + "</td></tr>");
		} else {
			$("#dateTimeCardOver").append("<tr><td>" + time + "</td>" + 
				                          "<td>Unavailable</td></tr>");
		}
	}
}
