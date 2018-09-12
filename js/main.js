var users     = firebase.database().ref('users/');
var auditions = firebase.database().ref('auditions/');
var content   = firebase.database().ref('content/');
var config    = firebase.database().ref('config/');

/********** Content Load ************/

content.child('homeMessage').once('value', function(snap) {
	$('#homeMessage').html( snap.val() );
});

content.child('homeTitle').once('value', function(snap) {
	$('#homeTitle').html( snap.val() );
});

content.child('afterSignUpMessage').once('value', function(snap) {
	$('#afterSignUpMessage').html( snap.val() );
});

// instrument packet links
config.once('value', function(snap) {
	var currentYear = snap.val().currentYear;

	// get instruments for current year
	auditions.child(currentYear).once('value', function(snap) {

		// iterate over all instruments appending them as <option>'s
		// to #inst <select> dropdown
		$.each( snap.val().instruments, function (i, inst) {
		    $('#inst').append($('<option>', { 
		        value: inst,
		        text : inst
		    }));

		    var inst = snap.child("pdfLinks/" + inst).key;
		    var link = snap.child("pdfLinks/" + inst).val();
		    if (link == null) {
		    	$('#packets').append("<tr><td><a href=\"#\">" + inst + "</a></td></tr");
		    } else if (inst === 'Trombones (tenor & bass)') {
		    	$('#packets').append("<tr><td><a href=\"https://umd.app.box.com/s/fzfc521i9bp97jrcesoodhzl0zhq3yhu\" target=\"_blank\">Tenor Trombone</a></td></tr");
		    	$('#packets').append("<tr><td><a href=\"#\">Bass Trombone</a></td></tr");
		    } else if (inst === 'French Horn') {
		    	$('#packets').append("<tr><td><a href=\"https://umd.app.box.com/s/w2klbfjdfbmuml2fmbg8oz3w2q1h4mr9\" target=\"_blank\">French Horn (Fresh/Soph/BAs/Minors)</a></td></tr");
		    	$('#packets').append("<tr><td><a href=\"https://umd.app.box.com/s/qr7w2prmwx2ato3pdgxhzfj9qrcjjjvr\" target=\"_blank\">French Horn (Juniors/Seniors/Grads)</a></td></tr");
		    } else {
		    	$('#packets').append("<tr><td><a href=\"https://" + link + "\" target=\"_blank\">" + inst + "</a></td></tr");
		    }
		});
	});
});

/****** Auth Change Listener *******/

// display spinner until this gets called. Will get called everytime page refreshes
firebase.auth().onAuthStateChanged( function(user) {
	$('#loader').hide();
	$('#allContent').show();

	if (user) {
		// User is signed in.
		var email = user.email;
		var uid = user.uid;

		if ( email === 'admin@umdensembleauditions.com' ) {
			showPage(['home'], ['admin']);
			$('.topAdminNav').show();
		} else {
			config.once('value', function(snap) {
                var currentYear = snap.val().currentYear;

                users.child(currentYear).child(uid).once('value', function (snap) {
                    var first_name = snap.val().firstname;
                    var last_name = snap.val().lastname;
                    var instrument = snap.val().instrument;
                    var hasSignedUp = snap.val().hasSignedUp;
                    var time = snap.val().time;

                    if (hasSignedUp) {
                        showAfterSignUp(currentYear, first_name, last_name, instrument, email, time);
                    } else {
                        showSignUp(currentYear, instrument);
                    }
                });
            });
		}
	} else {
		// User is signed out.
		// display default home page
	}
});

/************ "Routing" util function ***************/

function showPage(toHide, toShow, makeInactive, makeActive) {
	$.each(toHide, function(i, id) {
		$('#' + id).hide();
	})

	$.each(toShow, function(i, id) {
		$('#' + id).show();
	})

	$.each(makeInactive, function(i, id) {
		$('#' + id).removeClass('active');
	})

	$.each(makeActive, function(i, id) {
		$('#' + id).addClass('active');
	})
}
