const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
const bcrypt = require("bcryptjs");

const PORT = process.env.PORT || 3001;

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

// mysql://b11ecb5e420671:9776474f@us-cdbr-east-04.cleardb.com/heroku_595c3b505f305ee?reconnect=true

// const db_config = {
//   host: "us-cdbr-east-04.cleardb.com",
//   user: "b11ecb5e420671",
//   password: "9776474f",
//   database: "heroku_595c3b505f305ee",
// };

const db_config = {
  host: "localhost",
  user: "root",
  password: "password",
  database: "LoginSystem",
};

const db = mysql.createConnection(db_config);

app.post("/checkaccount", async (req, res) => {
  const email = req.body.email;

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
    if (err) {
      res.send({ message: err });
    }
    if (result.length > 0) {
      res.send({ message: "Email already exists" });
    } else {
      res.send({ message: "No errors" });
    }
  });
});

app.post("/register", async (req, res) => {
  const fullName = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const gender = req.body.gender;
  const dob = req.body.dob;
  const location = req.body.location;
  const profilePic = req.body.profilePic;
  const coverPhoto = req.body.coverPhoto;

  const encryptedPassword = await bcrypt.hash(password, 10);

  db.query(
    "INSERT INTO users (full_name, email, user_password, gender, dob, location, profile_pic, cover_photo, following, followers) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [
      fullName,
      email,
      encryptedPassword,
      gender,
      dob,
      location,
      profilePic,
      coverPhoto,
      0,
      0,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  db.query(
    "SELECT * FROM users WHERE email = ?",
    [email],
    async (err, result) => {
      if (err) {
        res.send({ err: err });
      } else {
        if (result.length > 0) {
          const comparison = await bcrypt.compare(
            password,
            result[0].user_password
          );
          if (comparison) {
            res.send(result);
          } else {
            res.send({ message: "Wrong email/password combination" });
          }
        } else {
          res.send({ message: "Wrong email/password combination" });
        }
      }
    }
  );
});

app.post("/post", async (req, res) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const postContent = req.body.postContent;
  const numLikes = req.body.numLikes;
  const image = req.body.image;
  const dateTime = req.body.dateTime;

  db.query(
    "INSERT INTO posts (userId, user_name, post_content, photo, date_posted, num_likes) VALUES (?, ?, ?, ?, ?, ?)",
    [userId, name, postContent, image, dateTime, numLikes],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        db.query(
          "SELECT posts.postId, posts.userId, user_name, post_content, photo, date_posted, num_likes, likeId FROM posts LEFT JOIN likes ON posts.userId = likes.userId AND posts.postId = likes.postId WHERE posts.userId = ?",
          [userId],
          (err, result) => {
            if (err) {
              console.log(err);
            } else {
              res.send(result);
            }
          }
        );
      }
    }
  );
});

app.post("/getPosts", async (req, res) => {
  const userId = req.body.userId;

  db.query(
    "SELECT posts.postId, posts.userId, user_name, post_content, photo, date_posted, num_likes, likeId FROM posts LEFT JOIN likes ON posts.userId = likes.userId AND posts.postId = likes.postId WHERE posts.userId = ?",
    [userId],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/updateLikes", async (req, res) => {
  const likes = req.body.likes;
  const postId = req.body.postId;

  db.query(
    "UPDATE posts SET num_likes = ? WHERE postId = ?",
    [likes, postId],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/addLike", async (req, res) => {
  const userId = req.body.userId;
  const postId = req.body.postId;

  db.query(
    "INSERT INTO likes (postId, userId) VALUES (?,?)",
    [postId, userId],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/removeLike", async (req, res) => {
  const userId = req.body.userId;
  const postId = req.body.postId;

  db.query(
    "DELETE FROM likes WHERE postId = ? AND userId = ?",
    [postId, userId],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/deletePost", async (req, res) => {
  const postId = req.body.postId;
  const userId = req.body.userId;

  db.query("DELETE FROM likes WHERE postId = ?", [postId], (err, result) => {
    if (err) {
      console.log(err);
    }
  });

  db.query("DELETE FROM posts WHERE postId = ?", [postId], (err, result) => {
    if (err) {
      console.log(err);
    } else {
      db.query(
        "SELECT posts.postId, posts.userId, user_name, post_content, photo, date_posted, num_likes, likeId FROM posts LEFT JOIN likes ON posts.userId = likes.userId AND posts.postId = likes.postId WHERE posts.userId = ?",
        [userId],
        (err, result) => {
          if (err) {
            console.log(err);
          } else {
            res.send(result);
          }
        }
      );
    }
  });
});

app.post("/changeProfile", async (req, res) => {
  const name = req.body.name;
  const profilePic = req.body.profilePic;
  const coverImg = req.body.coverImg;
  const userId = req.body.userId;

  if (name) {
    db.query(
      "UPDATE users SET full_name = ? WHERE id = ?",
      [name, userId],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    );

    db.query(
      "UPDATE posts SET user_name = ? WHERE userId = ?",
      [name, userId],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }

  if (profilePic) {
    db.query(
      "UPDATE users SET profile_pic = ? WHERE id = ?",
      [profilePic, userId],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }

  if (coverImg) {
    db.query(
      "UPDATE users SET cover_photo = ? WHERE id = ?",
      [coverImg, userId],
      (err, result) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
});

app.post("/getPhotos", async (req, res) => {
  const userId = req.body.userId;

  db.query(
    "SELECT photo FROM posts WHERE userId = ? AND photo IS NOT NULL",
    [userId],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.get("/getMostRecentQuestion", async (req, res) => {
  db.query(
    "SELECT * FROM questions WHERE date_posted = (SELECT MAX(date_posted) FROM questions)",
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/submitQuestion", async (req, res) => {
  const date = req.body.date;
  const question = req.body.question;

  db.query(
    "INSERT INTO questions (date_posted, question) VALUES (?, ?)",
    [date, question],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/getAnswer", async (req, res) => {
  const userId = req.body.userId;
  const questionId = req.body.questionId;

  db.query(
    "SELECT * FROM answers WHERE userId = ? AND questionId = ?",
    [userId, questionId],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/submitAnswer", async (req, res) => {
  const answer = req.body.answer;
  const userId = req.body.userId;
  const questionId = req.body.questionId;

  db.query(
    "INSERT INTO answers (questionId, userId, answer) VALUES (?, ?, ?)",
    [questionId, userId, answer],
    (err, result) => {
      if (err) {
        console.log(err);
      }
    }
  );
});

app.post("/getYesterdayQuestion", async (req, res) => {
  const date = req.body.date;

  db.query(
    "SELECT * FROM questions WHERE date_posted = ?",
    [date],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.post("/answerSums", async (req, res) => {
  const questionId = req.body.id;

  db.query(
    "SELECT COUNT(*) AS all_answers, (SELECT COUNT(*) FROM answers WHERE answer = 'yes' AND questionId = ?) AS yes_answers, (SELECT COUNT(*) FROM answers WHERE answer = 'no' AND questionId = ?) AS no_answers FROM answers WHERE questionId = ?",
    [questionId, questionId, questionId],
    (err, result) => {
      if (err) {
        console.log(err);
      } else {
        res.send(result);
      }
    }
  );
});

app.listen(PORT, () => {
  console.log("running server");
});
