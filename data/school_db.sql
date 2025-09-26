CREATE DATABASE IF NOT EXISTS school_db;
USE school_db;

CREATE TABLE teachers (
    teacher_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(100)
);

CREATE TABLE students (
    student_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT,
    major VARCHAR(100)
);

CREATE TABLE courses (
    course_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    credits INT
);

CREATE TABLE lectures (
    lecture_id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT,
    teacher_id INT,
    topic VARCHAR(200),
    date DATE,
    FOREIGN KEY (course_id) REFERENCES courses(course_id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(teacher_id)
);

CREATE TABLE enrollments (
    enrollment_id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT,
    course_id INT,
    FOREIGN KEY (student_id) REFERENCES students(student_id),
    FOREIGN KEY (course_id) REFERENCES courses(course_id)
);

INSERT INTO teachers (name, department) VALUES
('Ali Raza', 'Computer Science'),
('Fatima Khan', 'Computer Science'),
('Hassan Mahmood', 'Mathematics'),
('Ayesha Malik', 'Computer Science'),
('Bilal Ahmed', 'Software Engineering'),
('Sanaullah Khan', 'Computer Science'),
('Zainab Ali', 'Mathematics'),
('Omar Farooq', 'Software Engineering'),
('Hina Siddiqui', 'Computer Science'),
('Usman Sheikh', 'Software Engineering'),
('Rabia Hashmi', 'Mathematics'),
('Kamran Ali', 'Computer Science'),
('Sadia Noor', 'Software Engineering'),
('Tariq Mehmood', 'Mathematics'),
('Fariha Hassan', 'Computer Science');

INSERT INTO students (name, age, major) VALUES
('Ahmed Hassan', 20, 'Computer Science'),
('Ayesha Rahman', 21, 'Software Engineering'),
('Bilal Iqbal', 22, 'Mathematics'),
('Fatima Akhtar', 19, 'Computer Science'),
('Haris Malik', 20, 'Software Engineering'),
('Iqra Tanveer', 21, 'Computer Science'),
('Javed Ali', 23, 'Mathematics'),
('Khadija Shah', 20, 'Software Engineering'),
('Muhammad Usman', 22, 'Computer Science'),
('Nida Riaz', 21, 'Mathematics'),
('Omar Hayat', 20, 'Software Engineering'),
('Sana Mirza', 22, 'Computer Science'),
('Talha Kareem', 21, 'Mathematics'),
('Zara Cheema', 20, 'Software Engineering'),
('Saad Abdullah', 23, 'Computer Science');

INSERT INTO courses (name, credits) VALUES
('Introduction to Computing (ITC)', 3),
('Programming Fundamentals (PF)', 4),
('Object-Oriented Programming (OOP)', 3),
('Data Structures & Algorithms (DSA)', 4),
('Operating Systems (OS)', 3),
('Web Development', 3),
('Database Systems', 4),
('Computer Networks', 3),
('Artificial Intelligence', 3),
('Software Engineering', 4),
('Discrete Mathematics', 3),
('Linear Algebra', 3),
('Calculus', 4),
('Probability & Statistics', 3),
('Differential Equations', 3);

INSERT INTO lectures (course_id, teacher_id, topic, date) VALUES
(1, 1, 'History of Computing', '2024-03-01'),
(2, 2, 'Basic Syntax', '2024-03-02'),
(3, 5, 'Classes and Objects', '2024-03-03'),
(4, 6, 'Linked Lists', '2024-03-04'),
(5, 9, 'Process Management', '2024-03-05'),
(6, 10, 'HTML/CSS Basics', '2024-03-06'),
(7, 14, 'Relational Model', '2024-03-07'),
(8, 3, 'TCP/IP Protocol', '2024-03-08'),
(9, 8, 'Machine Learning', '2024-03-09'),
(10, 13, 'Agile Methodology', '2024-03-10'),
(11, 4, 'Set Theory', '2024-03-11'),
(12, 7, 'Matrix Operations', '2024-03-12'),
(13, 11, 'Limits and Derivatives', '2024-03-13'),
(14, 12, 'Probability Distributions', '2024-03-14'),
(15, 15, 'First Order Equations', '2024-03-15');

INSERT INTO enrollments (student_id, course_id) VALUES
(1, 1),
(2, 2),
(3, 3),
(4, 4),
(5, 5),
(6, 6),
(7, 7),
(8, 8),
(9, 9),
(10, 10),
(11, 11),
(12, 12),
(13, 13),
(14, 14),
(15, 15);

SELECT * FROM teachers;

SELECT * FROM students;

SELECT * FROM courses;

SELECT * FROM lectures;

SELECT * FROM enrollments;