function loginUser() {
    var email = $("#login_email").val();
    var password = $("#login_password").val();

    firebase.auth().signInWithEmailAndPassword(email, password).then(function() {
        var user = firebase.auth().currentUser;
        var userEmail = user.email;

        // clear inputs
        $("#login_email").val('');
        $("#login_password").val('');

        if (userEmail === 'admin@umdensembleauditions.com') {
            showPage(['home'], ['admin']);
            $('.topAdminNav').show();
        }
    }).catch(function(error) {
        swal({
            title: error.message,
            type: 'error',
            confirmButtonText: 'Ok'
        })

        // only clear password input
        $("#login_password").val('');
    });
}

function createNewUser() {
    var email = $("#reg_email").val();
    var password = $("#reg_password").val();
    var confirmPassword = $("#reg_confirmPassword").val();

    if (password === confirmPassword) {
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function() {
            var user = firebase.auth().currentUser;
            var uid = user.uid;

            config.once('value', function(snap) {
                var currentYear = snap.val().currentYear;

                users.child(currentYear + "/" + uid).set({
                    firstname: $("#firstname").val(),
                    lastname: $("#lastname").val(),
                    instrument: $("#inst").val(),
                    hasSignedUp: false,
                    email: email
                }).then( function () {
                    // showSignUp(currentYear, $("#inst").val());
                }).catch( function(error) {
                    // error
                });
            });
        }).catch(function(error) {
            if (error.code == "auth/email-already-in-use") {
                swal({
                    title: 'The email address is already in use. Use login instead.',
                    type: 'error',
                    confirmButtonText: 'Ok'
                })
            } else {
                swal({
                    title: error.message,
                    type: 'error',
                    confirmButtonText: 'Ok'
                })
            }
        });
    } else {
        swal({
            title: 'Passwords do not match',
            type: 'error',
            confirmButtonText: 'Ok'
        })
    }
}

function resetPassword() {
    swal({
        title: 'Enter your email and we\'ll send you a link to reset your password.',
        input: 'email',
        showCancelButton: true
    }).then( function(email) {
        var auth = firebase.auth();

        auth.sendPasswordResetEmail(email).then(function() {
          swal('Email sent to: ' + email);
        }).catch(function(error) {
          swal({
            title: error.message,
            type: 'error'
          });
        });
    }).catch(swal.noop);
}

function logOut() {
    firebase.auth().signOut().then(function() {
      // Sign-out successful.
      location.reload();
    }).catch(function(error) {
      // An error happened.
    });
}