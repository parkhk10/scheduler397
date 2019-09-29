import React from 'react';
import 'rbx/index.css';
import {Button, Container, Title, Message} from 'rbx';
import {    timeParts,
    getCourseNumber,
    getCourseTerm,
    timeConflict } from './times.js';

import firebase from 'firebase/app';
import 'firebase/database';

const firebaseConfig = {
    apiKey: "AIzaSyAopkyEkLc0S0aqcMdEorDmcQm25-VoKk8",
    authDomain: "scheduler397.firebaseapp.com",
    databaseURL: "https://scheduler397.firebaseio.com",
    projectId: "scheduler397",
    storageBucket: "",
    messagingSenderId: "433957171018",
    appId: "1:433957171018:web:b03bd953fa570fb521dbb3"
    };
    
    firebase.initializeApp(firebaseConfig);
    const db = firebase.database().ref();

const buttonColor = selected => (
    selected ? 'success' : null
  );

  const hasConflict = (course, selected) => (
    selected.some(selection => courseConflict(course, selection))
  );

  const courseConflict = (course1, course2) => (
    course1 !== course2 
    && getCourseTerm(course1) === getCourseTerm(course2)
    && timeConflict(course1, course2)
  );

  const saveCourse = (course, meets) => {
    db.child('courses').child(course.id).update({meets})
      .catch(error => alert(error));
  };

const moveCourse = course => {
    const meets = prompt('Enter new meeting data, in this format: ', course.meets);
    if (!meets) return;
    const {days} = timeParts(meets);
    if (days) saveCourse(course, meets);
    else moveCourse(course);
  };

const Course = ({course, state, user}) => (
    <Button color={buttonColor(state.selected.includes(course))}
            onClick={() => state.toggle(course)}
            onDoubleClick={user ? () => moveCourse(course) : null}
            disabled={hasConflict(course, state.selected)}
    >
        {getCourseTerm(course)} CS {getCourseNumber(course)} : {course.title}
    </Button>
    )

export default Course;