import React, { useState, useEffect } from "react";
import { Dropdown } from "primereact/dropdown";
import { Card } from "primereact/card";
import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";
import "./App.css";

const App = () => {
  const [user, setUser] = useState(null);
  const [pages, setPages] = useState([]);
  const [isPagesFetched, setIsPagesFetched] = useState(false);
  const [selectedPage, setSelectedPage] = useState(null);
  const [pageImpressions, setPageImpressions] = useState([]);
  const [page_fans, setPageFans] = useState([]);
  const [postEngagements, setPostEngagements] = useState([]);
  const [postLikeReactions, setPostLikeReactions] = useState([]);
  const [error, setError] = useState("");

  const userAccessTokenTwo =
    "your_access_token"; // Replace with your user access token

  // Initialize Facebook SDK
  const initializeFacebookSDK = (appId) => {
    window.fbAsyncInit = function () {
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: "v22.0",
      });
    };

    (function (d, s, id) {
      if (d.getElementById(id)) return;
      let js = d.createElement(s);
      js.id = id;
      js.src = "https://connect.facebook.net/en_US/sdk.js";
      d.getElementsByTagName(s)[0].parentNode.insertBefore(js, null);
    })(document, "script", `facebook-jssdk-${appId}`);
  };

  // Handle Facebook Login
  const handleLogin = () => {
    window.FB.login(
      (response) => {
        if (response.authResponse) {
          fetchUserData();
        } else {
          setError("Login failed.");
        }
      },
      { scope: "public_profile,email" }
    );
  };

  // Fetch User Data
  const fetchUserData = () => {
    window.FB.api("/me", { fields: "id,name,picture" }, (response) => {
      if (response && !response.error) {
        setUser({
          name: response.name,
          profilePicture: response.picture.data.url,
        });
      } else {
        setError("Error fetching user data.");
      }
    });
  };

  // Fetch User's Pages
  const fetchPages = () => {
    window.FB.api(
      "/me/accounts",
      { access_token: userAccessTokenTwo },
      (response) => {
        if (response && !response.error) {
          setPages(response.data);
          setIsPagesFetched(true);
        } else {
          setError("Error fetching pages.");
        }
      }
    );
  };

  // Initialize App Two (Business App)
  const initializeAppTwo = () => {
    initializeFacebookSDK("1130977914903248"); // Second Facebook App ID
  };

  useEffect(() => {
    initializeFacebookSDK("1663648387563779"); // First Facebook App ID (Consumer)
  }, []);

  initializeAppTwo();

  const fetchPageAccessToken = (pageId) => {
    window.FB.api(
      `/${pageId}`,
      {
        fields: "access_token",
        access_token: userAccessTokenTwo, // Replace with your user access token
      },
      (response) => {
        if (response && !response.error) {
          const pageAccessToken = response.access_token;
          console.log("Page Access Token:", pageAccessToken);

          // Fetch page insights
          fetchPageInsights(pageId, pageAccessToken);
        } else {
          console.error("Error fetching page access token:", response.error);
        }
      }
    );
  };
  // Fetch Page Insights
  const fetchPageInsights = (pageId, pageAccessToken) => {
    const endpoints = [
      { path: 'page_impressions', setter: setPageImpressions },
      { path: 'page_fans', setter: setPageFans }, // page_fans period is 'day'
      { path: 'page_post_engagements', setter: setPostEngagements },
      { path: 'page_actions_post_reactions_like_total', setter: setPostLikeReactions }
    ];
  
    endpoints.forEach(({ path, setter }) => {
      fetch(
        `https://graph.facebook.com/${pageId}/insights/${path}?access_token=${pageAccessToken}`
      )
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            setError(`Error fetching ${path} data: ${data.error.message}`);
          } else {
            if (path === 'page_fans') {
              // Handle 'day' period for page_fans
              setter(data.data); // Directly pass data without filtering for 'days_28'
            } else {
              // Filter for other metrics with 'days_28' period
              const filteredData = data.data.filter((item) => item.period === 'days_28');
              setter(filteredData);
            }
          }
        })
        .catch(() => {
          setError(`Error performing ${path} API call.`);
        });
    });
  };
  

  // Log selected page ID
  const handlePageSelect = (e) => {
    console.log("Selected Page ID:", e.value.id);
    setSelectedPage(e.value);
    fetchPageAccessToken(e.value.id); // Fetch the page access token and insights
  };

  return (
    <>
      <div className="app">
  <h1>Facebook OAuth Login</h1>

  {user ? (
    <div>
      <h2>Welcome, {user.name}</h2>
      <img src={user.profilePicture} alt="Profile" />
      {!isPagesFetched ? (
        <button onClick={fetchPages}>Fetch User Pages</button>
      ) : (
        <div>
          <h3>Your Pages:</h3>
          <Dropdown
            value={selectedPage}
            options={pages}
            onChange={handlePageSelect}
            optionLabel="name"
            placeholder="Select a Page"
            style={{ width: "300px" }}
          />
        </div>
      )}

      {/* Facebook Page Insights Section */}
      <div>
        <h1>Facebook Page Insights</h1>
        {error && <p style={{ color: "red" }}>{error}</p>}

        <div className="insights-grid">
          {[ 
            { title: "Total Page Impressions", data: pageImpressions },
            { title: "Total Page Fans/Followers", data: page_fans },
            { title: "Total Post Engagements", data: postEngagements },
            { title: "Total Post Reactions", data: postLikeReactions }
          ].map(({ title, data }) => (
            <div key={title} className="insight-card">
              <h2>{title}</h2>
              {data.length > 0 ? (
                data.map((item, index) => (
                  <Card key={index} title={item.title} subTitle={`Period: ${item.period}`} style={{ marginBottom: "1rem" }}>
                    <p>{item.description}</p>
                    <ul style={{ listStyleType: "none" }}>
                      {item.values.map((value, idx) => (
                        <li key={idx}>
                          <strong>Date:</strong> {new Date(value.end_time).toLocaleDateString()} - {" "}
                          <strong>Value:</strong> {value.value}
                        </li>
                      ))}
                    </ul>
                  </Card>
                ))
              ) : (
                <p>No data available.</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  ) : (
    <button onClick={handleLogin}>Login with Facebook</button>
  )}

  {error && <p style={{ color: "red" }}>{error}</p>}
</div>

    </>
  );
};

export default App;
