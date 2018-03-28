<cflogout>

<!DOCTYPE HTML PUBLIC "-//W3C//Dtd HTML 4.01 transitional//EN" "http://www.w3.org/tr/html4/loose.dtd">
<html>
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1">
<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
<meta http-equiv="Pragma" content="no-cache">
<meta http-equiv="Expires" content="-1">

<script src="https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js"></script>

<script type="text/javascript">
	handleLogin = function() {
		$("#loader").show();
        var packet = {"username": $("#username").val(), "password": $("#password").val()};
        $.post("processLogin.cfm", packet, function(response) {
			if (response === 'authenticated') {
				setTimeout(function() {
					window.top.location = 'layout.cfm';
					$("#loader").hide();
				}, 3500 );
            } else {
                alert('Invalid login - please try again.');
            }
		} );
	}
</script>
</head>

<body>
<img src="images/kgs_logo.png">
<p>
Tremor Database Mapper:
<p>
<cfform name="frmLogin" id="frmLogin" onsubmit="handleLogin();return false;">
<table class="login" cellspacing="3">
	<tr><td class="label">User Name:</td><td><input type="text" name="username" id="username" size="25"></td></tr>
	<tr><td class="label">Password:</td><td><input type="password" name="password" id="password" size="25"></td></tr>
	<tr><td></td><td><input class="submit" type="submit" name="login" value="Log In" style="margin-right:8px"><img id="loader" style="display:none" src="images/ajax-loader.gif"></td></tr>
</table>
</cfform>

</body>
<html>
