import React, {useState, useEffect} from 'react';
import 'rbx/index.css';
import {Button, Container, Title, Message} from 'rbx';

import firebase from 'firebase/app';
import 'firebase/database';

// import firebase auth
import 'firebase/auth';

// import firebase auth ui library
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

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

const uiConfig = {
  signInFlow: 'popup',
  signInOptions: [
    firebase.auth.GoogleAuthProvider.PROVIDER_ID
  ],
  callbacks: {
    signInSuccessWithAuthResult: () => false
  }
};

const terms = { F: 'Fall', W: 'Winter', S: 'Spring'};

// a conflict must involve overlapping days and times
const days = ['M', 'Tu', 'W', 'Th', 'F'];

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

const daysOverlap = (days1, days2) => ( 
  days.some(day => days1.includes(day) && days2.includes(day))
);

const hoursOverlap = (hours1, hours2) => (
  Math.max(hours1.start, hours2.start) < Math.min(hours1.end, hours2.end)
);

const timeConflict = (course1, course2) => (
  daysOverlap(course1.days, course2.days) && hoursOverlap(course1.hours, course2.hours)
);

const courseConflict = (course1, course2) => (
  course1 !== course2 
  && getCourseTerm(course1) === getCourseTerm(course2)
  && timeConflict(course1, course2)
);

const hasConflict = (course, selected) => (
  selected.some(selection => courseConflict(course, selection))
);

const Banner = ({user, title}) => (
  <React.Fragment>
    {user ? <Welcome user={user} /> : <SignIn />}
  <Title>{title || '[loding...]'}</Title>
  </React.Fragment>
);

const Welcome = ({ user }) => (
  <Message color="info">
    <Message.Header>
      Welcome, {user.displayName}
      <Button primary onClick={() => firebase.auth().signOut()}>
        Log out
      </Button>
    </Message.Header>
  </Message>
);

const SignIn = () => (
  <StyledFirebaseAuth
    uiConfig={uiConfig}
    firebaseAuth={firebase.auth()}
  />
);

const getCourseTerm = course => (
  terms[course.id.charAt(0)]
);

const getCourseNumber = course => (
  course.id.slice(1, 4)
);

const buttonColor = selected => (
  selected ? 'success' : null
);

const TermSelector = ({state}) => (
  <Button.Group hasAddons>
    { Object.values(terms)
        .map(value => <Button key={value}
                        color={ buttonColor(value === state.term) }
                        onClick={() => state.setTerm(value)}>{ value }</Button>
        )
    }
  </Button.Group>
);

const Course = ({course, state, user}) => (
  <Button color={buttonColor(state.selected.includes(course))}
          onClick={() => state.toggle(course)}
          onDoubleClick={user ? () => moveCourse(course) : null}
          disabled={hasConflict(course, state.selected)}
  >
    {getCourseTerm(course)} CS {getCourseNumber(course)} : {course.title}
  </Button>
)

// for toggling - like useState function but returns our own 
// toggle function instead of setSelected function
// essentially a custom hook
const useSelection = () => {
  const [selected, setSelected] = useState([]);
  const toggle = (x) => {
    setSelected(selected.includes(x) ? selected.filter(y => y !== x) : [x].concat(selected))
  };
  return [selected, toggle];
}

const CourseList = ({courses, user}) => {
  const [term, setTerm] = useState('Fall');
  const [selected, toggle] = useSelection();
  const termCourses = courses.filter(course => term === getCourseTerm(course))
  return (
    <React.Fragment>
    <TermSelector state={{term, setTerm}} />
    <Button.Group>
      {termCourses.map(course => <Course key={course.id} course={course} 
                                    state={{selected, toggle}}
                                    user={user} />)}
    </Button.Group>
  </React.Fragment>
  )
};

const timeParts = meets => {
  const [match, days, hh1, mm1, hh2, mm2] = meetsPat.exec(meets) || [];
  return !match ? {} : {
    days,
    hours: {
      start: hh1 * 60 + mm1 * 1,
      end: hh2 * 60 + mm2 * 1
    }
  };
};

const addCourseTimes = course => ({
  ...course, // get all the previous attributes of a course and add a new attribute
  ...timeParts(course.meets)
});

const addScheduleTimes = schedule => ({
  title: schedule.title,
  courses: Object.values(schedule.courses).map(addCourseTimes)
});

const moveCourse = course => {
  const meets = prompt('Enter new meeting data, in this format: ', course.meets);
  if (!meets) return;
  const {days} = timeParts(meets);
  if (days) saveCourse(course, meets);
  else moveCourse(course);
};

const saveCourse = (course, meets) => {
  db.child('courses').child(course.id).update({meets})
    .catch(error => alert(error));
};

const App = () =>  {
  const [schedule, setSchedule] = useState({title: '', courses: []});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const handleData = snap => {
      if (snap.val()) setSchedule(addScheduleTimes(snap.val()))
    }
    db.on('value', handleData, error => alert(error));
    return () => {
      db.off('value', handleData);
    };
  }, []) // second argument [] makes it so that useEffect is run only when app is mounted

  useEffect(() => {
    firebase.auth().onAuthStateChanged(setUser)
  }, []);

  return(
    <Container>
     <Banner title={schedule.title} user={user} />
     <CourseList courses={schedule.courses} user={user} />
   </Container>
  );
}

export default App;