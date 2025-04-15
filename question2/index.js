const express = require("express");
const app = express();
const cors = require("cors");
const axios = require("axios");

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Base URL of the social media server
const baseUrl = "http://20.244.56.144/evaluation-service";

// Bearer Token for Authorization
const bearerToken = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQ0NzAwNjQ4LCJpYXQiOjE3NDQ3MDAzNDgsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6Ijc1NzliMThlLWM3MjctNGJkNC1iZjA5LTIwMGZkMWYyZDEwZCIsInN1YiI6Imthc2hpc2g0OTUuYmUyMkBjaGl0a2FyYS5lZHUuaW4ifSwiZW1haWwiOiJrYXNoaXNoNDk1LmJlMjJAY2hpdGthcmEuZWR1LmluIiwibmFtZSI6Imthc2hpc2ggYmFydGh3YWwiLCJyb2xsTm8iOiIyMjEwOTkwNDk1IiwiYWNjZXNzQ29kZSI6IlB3enVmRyIsImNsaWVudElEIjoiNzU3OWIxOGUtYzcyNy00YmQ0LWJmMDktMjAwZmQxZjJkMTBkIiwiY2xpZW50U2VjcmV0IjoiaE15VWdqdm5KSnRkUHZqeiJ9.kQy5E16MA4N_Zb2FgcdVFSmKubl0bHSmqECLnNA55K0";

// FETCH USERS
const fetchUsers = async () => {
  try {
    const response = await axios.get(`${baseUrl}/users`, {
      headers: { Authorization: bearerToken },
    });
    return response.data.users;
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return null;
  }
};

// FETCH POSTS
const fetchPosts = async (userId) => {
  try {
    const response = await axios.get(`${baseUrl}/users/${userId}/posts`, {
      headers: { Authorization: bearerToken },
    });
    return response.data.posts;
  } catch (error) {
    console.error(`Error fetching posts for user ${userId}:`, error.message);
    return [];
  }
};

// FETCH COMMENTS
const fetchComments = async (postId) => {
  try {
    const response = await axios.get(`${baseUrl}/posts/${postId}/comments`, {
      headers: { Authorization: bearerToken },
    });
    return response.data.comments;
  } catch (error) {
    console.error(`Error fetching comments for post ${postId}:`, error.message);
    return [];
  }
};

// API: Get Top Users based on comment count
app.get("/users", async (req, res) => {
  try {
    const users = await fetchUsers();
    if (!users) return res.status(500).json({ error: "Failed to fetch users" });

    const userComments = [];

    for (const user of users) {
      const posts = await fetchPosts(user.id);
      let commentCount = 0;

      for (const post of posts) {
        const comments = await fetchComments(post.id);
        commentCount += comments.length;
      }

      userComments.push({ user, commentCount });
    }

    userComments.sort((a, b) => b.commentCount - a.commentCount);
    const topUsers = userComments.slice(0, 5);

    res.json(topUsers);
  } catch (error) {
    console.error("Error fetching top users:", error.message);
    res.status(500).json({ error: "Failed to fetch top users" });
  }
});

// API: Get Posts (Latest or Popular)
app.get("/posts", async (req, res) => {
  const type = req.query.type;

  try {
    const postsData = [];
    const users = await fetchUsers();

    for (const user of users) {
      const posts = await fetchPosts(user.id);
      for (const post of posts) {
        const comments = await fetchComments(post.id);
        postsData.push({ post, commentsCount: comments.length });
      }
    }

    if (type === "popular") {
      postsData.sort((a, b) => b.commentsCount - a.commentsCount);
      const maxComments = postsData[0]?.commentsCount || 0;
      const mostCommentedPosts = postsData.filter((p) => p.commentsCount === maxComments);
      res.json(mostCommentedPosts.map((p) => p.post));
    } else if (type === "latest") {
      postsData.sort((a, b) => b.post.id - a.post.id);
      res.json(postsData.slice(0, 5).map((p) => p.post));
    } else {
      res.status(400).json({ error: 'Invalid type parameter. Use "popular" or "latest".' });
    }
  } catch (error) {
    console.error("Error fetching posts:", error.message);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
});

const PORT = 9876;
app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log(`Server running on Port: ${PORT}`);
});
