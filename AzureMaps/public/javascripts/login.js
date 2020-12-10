var authManager = new msAuth.AuthManager({
    clientId: "ccdae75c-5020-47aa-a6cc-070ae6ae89b9",
    tenant: "be46afd0-8a22-40d5-8e63-b9f3282bcb2e"
  });

  function onLoginClick() {
    authManager.login();

    // To let users log out, just call the logout function
    // authManager.logout();
  }

  document.addEventListener("DOMContentLoaded", function () {
    authManager.finalizeLogin().then(function (res) {
      var results = document.getElementById('results');
      if (!res.isLoggedIn) {
        results.textContent = "Not logged in";
      } else {
        // These credentials can be provided to any azure-sdk-for-js client class.
        const creds = res.creds;
        results.textContent = "Subscriptions: " + JSON.stringify(res.availableSubscriptions);
      }
    });
  });


// const login = () => {
//     authManager.finalizeLogin().then((res) => {
//         console.log(res.isLoggedIn);
//         if (!res.isLoggedIn) {
//           // may cause redirects
//           authManager.login();
//         }
//         console.log('test');
//         console.log(res.creds);

//     // To let users log out, just call the logout function
//     // authManager.logout();
//     }).catch(err => {
//         console.log(err);
//     });
//   }

const logout = () => {
    authManager.logout();
}




/* 
  document.addEventListener("DOMContentLoaded", function () {
    authManager.finalizeLogin().then(function (res) {
      var results = document.getElementById('results');
      if (!res.isLoggedIn) {
        results.textContent = "Not logged in";
      } else {
        // These credentials can be provided to any azure-sdk-for-js client class.
        const creds = res.creds;
        results.textContent = "Subscriptions: " + JSON.stringify(res.availableSubscriptions);
      }
    });
  }); */