// Run main logic after the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", main);

function main() {
  displayPosts();         // Load and display all posts
  addNewPostListener();   // Attach event listener to the new post form
}

// Fetch and render all posts in the post list section
function displayPosts() {
  fetch("http://localhost:3000/posts")
    .then(res => res.json())
    .then(posts => {
      const postList = document.getElementById("post-list");
      postList.innerHTML = ""; // Clear any previous content

      posts.forEach(post => {
        // Create a clickable wrapper for each post preview
        const wrapper = document.createElement("div");
        wrapper.classList.add("post-item");

        // Inline styling for the post item
        Object.assign(wrapper.style, {
          display: "flex",
          alignItems: "center",
          gap: "12px",
          cursor: "pointer",
          marginBottom: "12px",
          padding: "10px",
          border: "1px solid #ddd",
          borderRadius: "6px",
          backgroundColor: "#fafafa",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)"
        });

        // Image preview
        const img = document.createElement("img");
        img.src = post.image || "https://via.placeholder.com/100";
        img.alt = post.title;
        Object.assign(img.style, {
          width: "100px",
          height: "auto",
          borderRadius: "4px",
          objectFit: "cover"
        });

        // Post title
        const title = document.createElement("span");
        title.textContent = post.title;
        Object.assign(title.style, {
          fontSize: "1rem",
          fontWeight: "600",
          color: "#333"
        });

        // Append image and title to wrapper
        wrapper.appendChild(img);
        wrapper.appendChild(title);

        // Clicking this post shows full details
        wrapper.addEventListener("click", () => handlePostClick(post.id));
        postList.appendChild(wrapper);
      });

      // Automatically show details for the first post (optional)
      if (posts.length > 0) {
        handlePostClick(posts[0].id);
      }
    })
    .catch(err => {
      console.error("Failed to load posts:", err);
      document.getElementById("post-list").innerHTML =
        `<p style="color: red;">Failed to load blog posts. Please check your server or connection.</p>`;
    });
}

// Load and display full details of a single post by ID
function handlePostClick(id) {
  fetch(`http://localhost:3000/posts/${id}`)
    .then(res => res.json())
    .then(post => {
      const detail = document.getElementById("post-detail");

      // Replace inner content with selected post details
      detail.innerHTML = `
        <h2>${post.title}</h2>
        <img src="${post.image || 'https://via.placeholder.com/150'}" 
             alt="Post Image" 
             style="max-width: 100%; height: auto; border-radius: 6px;" />
        <p>${post.content}</p>
        <p><em>By ${post.author}</em></p>
        <button id="edit-btn">Edit</button>
        <button id="delete-btn">Delete</button>
      `;

      // Attach event listeners to action buttons
      document.getElementById("edit-btn").addEventListener("click", () => loadEditForm(post));
      document.getElementById("delete-btn").addEventListener("click", () => deletePost(post.id));
    });
}

// Handle submission of the new post form
function addNewPostListener() {
  const form = document.getElementById("new-post-form");

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    const fileInput = form.elements.imageFile;
    const file = fileInput.files[0];

    const newPost = {
      title: form.title.value,
      content: form.content.value,
      author: form.author.value
    };

    // If a file is selected, read it as a base64 data URL
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPost.image = reader.result;
        submitPost(newPost);
      };
      reader.readAsDataURL(file);
    } else {
      newPost.image = "https://via.placeholder.com/150"; // fallback image
      submitPost(newPost);
    }
  });

  // Handles sending the new post to the backend
  function submitPost(postData) {
    fetch("http://localhost:3000/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(postData)
    })
      .then(res => res.json())
      .then(() => {
        displayPosts(); // Refresh the post list
        form.reset();   // Clear the form
      })
      .catch(err => {
        console.error("Failed to create post:", err);
        alert("Error creating post.");
      });
  }
}

// Delete a post by its ID (with confirmation)
function deletePost(id) {
  if (confirm("Are you sure you want to delete this post?")) {
    fetch(`http://localhost:3000/posts/${id}`, {
      method: "DELETE"
    })
    .then(() => displayPosts())
    .catch(err => {
      console.error("Failed to delete post:", err);
      alert("Could not delete post.");
    });
  }
}

// Load edit form with selected post data and allow inline updates
function loadEditForm(post) {
  const form = document.getElementById("edit-post-form");
  form.classList.remove("hidden");

  document.getElementById("edit-title").value = post.title;
  document.getElementById("edit-content").value = post.content;

  // Submit updated post data
  form.onsubmit = function (e) {
    e.preventDefault();

    const updatedPost = {
      title: document.getElementById("edit-title").value,
      content: document.getElementById("edit-content").value,
      author: post.author,
      image: post.image // reuses original image
    };

    fetch(`http://localhost:3000/posts/${post.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedPost)
    })
    .then(() => {
      displayPosts();
      form.reset();
      form.classList.add("hidden");
    })
    .catch(err => {
      console.error("Failed to update post:", err);
      alert("Could not update post.");
    });
  };

  // Hide form on cancel
  document.getElementById("cancel-edit").onclick = () => {
    form.reset();
    form.classList.add("hidden");
  };
}