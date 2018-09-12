var pdfLinks = {};

var linkFor = 'none';

// displays the edit content admin page
// which allows the admin to edit the 'Home Title', 'Home message', 
// 'After sign up message' and 'Instrument packet links'
function editContent() {
	showPage(['overview', 'conf_auditions', 'other'], ['edit_content'], 
             ['overview_nav', 'conf_nav', 'other_nav'], ['edit_nav']);

	// get homeTitle and homeMessage from DB and set as value for their text inputs
	content.once('value', function(snap) {
		$('#homeTitleEdit').val( snap.val().homeTitle );
		$('#homeMessageEdit').val( snap.val().homeMessage );
		$('#afterSignUpMessageEdit').val( snap.val().afterSignUpMessage );
	});

	$("#packetLinksContent option").remove();

	// get current year
	config.once('value', function(snap) {
		var currentYear = snap.val().currentYear;

		// get instruments for current year
		auditions.child(currentYear).once('value', function(snap) {

			// iterate over all instruments appending them as <option>s
			// to #packetLinksContent <select> dropdown
			$.each( snap.val().instruments, function (i, inst) {
			    $('#packetLinksContent').append($('<option>', { 
			        value: inst,
			        text : inst
			    }));
			});

			$.each( snap.val().pdfLinks, function (inst, link) {
				pdfLinks[inst] = link;
			});
		});
	});
}

// called when Update Content button is clicked
// writes the 'Home title', 'Home message', 'After sign up message'
// and PDF links to the database
function updateContent() {

	if ( !(linkFor === 'none') ) {
		var inst = linkFor;
		pdfLinks[inst] = $('#packetLink').val();
	}

	// get current year
	config.once('value', function(snap) {
		content.update({
			homeTitle: $('#homeTitleEdit').val(),
			homeMessage: $('#homeMessageEdit').val(),
			afterSignUpMessage: $('#afterSignUpMessageEdit').val()
	    }).then( function () {
			location.reload();
	    }).catch( function(error) {
			// user not logged in as admin
	    	alert("Authentication error: \n" + error);
	    });

	    if ( snap.val() != null) {
	    	var currentYear = snap.val().currentYear;

	    	auditions.child(currentYear).update({
		    	pdfLinks: pdfLinks
		    })
	    }
	});
}

// allows multiple packet links to be updated at once
$('#packetLinksContent').change( function() {
	// update using what's in the link text input
	var inst;
	if ( !(linkFor === 'none') ) {
		inst = linkFor;
		pdfLinks[inst] = $('#packetLink').val();
	}

	// display current link for the selected instrument
	inst = $('#packetLinksContent').val();
	if (pdfLinks[inst]) {
		$('#packetLink').val( pdfLinks[inst] );
	} else {
		$('#packetLink').val('');
	}

	// update what inst the input is for so next time <select> changes
	// it will update the JS obj
	linkFor = inst;
});