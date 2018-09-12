// sign up form logic
// responsible for displaying time slots for a student's instrument
// student can select one time slot then click submit
// if they have already signed up then the 'afterSignUp' page will be
// displayed showing them what time they signed up for
// 3 different entry points here, create new user, login and auth state change

var currentDay = 1;
function showSignUp(currentYear, inst) {
	// get information about logged in user, either by passing snap object or using
	// Firebase function to get the current user
	showPage(['login', 'register'], ['signUp']);
	$(".home-nav").remove();
	$("#signUpInstrument").html( inst );

	auditions.child(currentYear + "/dateTimes/" + inst).once('value', function(auditionsSnap) {
		var dates = auditionsSnap.val().dates;
		appendDayNavsSignUp(auditionsSnap.val().numDays, inst, dates); // display the date, not day 1, day 2 etc

		users.child(currentYear).once('value', function(snap) {

			var slots = auditionsSnap.child('slots/1').val(); // default to 1st day
			$.each( slots, function (key, val) {
				showSlots(key, val['uid'], snap);
			});
		});
	});
}

function showSlots(time, uid, names) {
	var displayTime = time.replace(/:\d\d /, "");
	if (uid == false) {
		$("#signUpTimes").append("<tr><td>" + displayTime + "</td>" +
		                             "<td><input type=\"radio\" name=\"time\" value=\"" + 
		                              time + "\"></td></tr>");
	} else if (uid == "Unavailable") {
		$("#signUpTimes").append("<tr><td>" + displayTime + "</td>" + 
			                         "<td>Unavailable</td></tr>");
	} else {
		if (names.child(uid).val() != null &&
			names.child(uid).val().firstname != null &&
			names.child(uid).val().lastname != null) {
			var name = names.child(uid).val().firstname + " " + names.child(uid).val().lastname;
			$("#signUpTimes").append("<tr><td>" + displayTime + "</td>" + 
				                         "<td>" + name + "</td></tr>");
		} else {
			$("#signUpTimes").append("<tr><td>" + displayTime + "</td>" + 
				                         "<td>Unavailable</td></tr>");
		}
	}
}

function appendDayNavsSignUp(numDays, inst, dates) {
	$(".signup-nav").remove();
	for ( var i = 1; i <= numDays; i++ ) {
		var active = '';
		if (i == 1) {
			active = 'active';
		}
		var day = moment(dates[i].date).format('MM/DD/YYYY');
		$("#nav").append('<li class="nav-item signup-nav"><a id="day_' + i + '_nav_signup" class="nav-link '
		 + active + '" onclick="showDaySignUp(' + i + ', \'' + inst + '\')">' + day + '</a></li>');
	}
}

function showDaySignUp(i, inst) {
	currentDay = i;
	showPage(undefined, undefined, ['day_1_nav_signup', 'day_2_nav_signup', 'day_3_nav_signup', 'day_4_nav_signup'], 
			 ['day_' + i + '_nav_signup']);
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;
		$("#signUpTimes tr").remove();

		auditions.child(currentYear + "/dateTimes/" + inst).once('value', function(auditionsSnap) {
			var dates = auditionsSnap.val().dates;

			users.child(currentYear).once('value', function(snap) {
				var slots = auditionsSnap.child('slots/' + i).val(); // show ith day for given inst
				$.each( slots, function (key, val) {
					showSlots(key, val['uid'], snap);
				});
			});
		});
	});
}

function lookUpUser(uid) {
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;

		users.child(currentYear + "/" + uid).once('value', function(snap) {
			return snap.val().firstname + " " + snap.val().lastname;
		});
	});
}

// asks user to confirm audition and if confirmed submits audition to database
function addAudition() {
	var user = firebase.auth().currentUser;
	var uid = user.uid;
	var email = user.email;

	config.once('value', function(configSnap) {
		var currentYear = configSnap.val().currentYear;

		users.child(currentYear + "/" + uid).once('value', function(snap) {
			addAuditionToDB(currentYear, uid, email, snap);
		});
	});	
}

function addAuditionToDB(currentYear, uid, email, snap) {
	var firstname = snap.val().firstname;
	var lastname = snap.val().lastname;
	var inst = snap.val().instrument;
	var hasSignedUp = snap.val().hasSignedUp;
	var time = $('input[name="time"]:checked').val();

	var correctAudition = true;
	var html = '';

	if (time == undefined) {
		html += 'Please select a time<br>'
		correctAudition = false;
	}

	if (correctAudition) {
		swal({
			title: 'Review and Confirm Your Audition',
			html:
				'<b>Name: </b>' + firstname + ' ' + lastname
				+ '<br/>' +
				'<b>Instrument: </b>' + inst
				+ '</br>' +
				'<b>Time: </b>' + time.replace(/:\d\d /, "")
				+ '</br>' +
				'<b>Email: </b>' + email,
			type: 'question',
			showCancelButton: true,
			cancelButtonText: 'Make Changes',
			confirmButtonText: 'Confirm'
		}).then(function () {
			// check that slot's selected field is still false before updating
			auditions.child(currentYear + "/dateTimes/" + inst + "/slots/" + currentDay + "/" + time).once('value', function (snap) {
				var slot = snap.val();
				if (slot.uid == false) {
					auditions.child(currentYear + "/dateTimes/" + inst +
								    "/slots/" + currentDay + "/" + time).update({
						uid: uid
					}).then( function() {
						users.child(currentYear + "/" + uid).update({
							hasSignedUp: true,
							time: time,
							day: currentDay
						});
						showAfterSignUp(currentYear, firstname, lastname, inst, email, time);
					});
				} else {
					swal({
						title: 'Whoops! Looks like someone else took that audition time\
						between when this page was loaded and when submit was pressed.\
						Please select a different time.',
						type: 'error',
						confirmButtonText: 'Ok'
					}).then(function () {
						// displayTable(inst);
						location.reload();
					})
				}
			})
		}).catch(swal.noop)
	} else {
		swal({
			title: 'Invalid information',
			html: html,
			type: 'error',
			confirmButtonText: 'Ok'
		}).then(function () {

		})
	} // end correctAudition
}

function showAfterSignUp(currentYear, first_name, last_name, instrument, email, time) {
	showPage(['login', 'register', 'nav', 'signUp'], ['afterSignUp']);
	$("#firstnameAfter").text(first_name);
	$("#lastnameAfter").text(last_name);
	$("#instrumentAfter").text(instrument);
	$("#emailAfter").text(email);
	$("#timeAfter").text(time.replace(/:\d\d /, ""));
	var element = document.getElementById("afterSignUpMessage");
	element.focus();
	element.scrollIntoView();
}