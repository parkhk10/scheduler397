import React, {useState, useEffect} from 'react';
import 'rbx/index.css';
import {Button, Container, Title, Message} from 'rbx';

import firebase from 'firebase/app';
import 'firebase/database';

// import firebase auth
import 'firebase/auth';

// import firebase auth ui library
import StyledFirebaseAuth from 'react-firebaseui/StyledFirebaseAuth';

// import modularized component
import CourseList from './components/CourseList';

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

const meetsPat = /^ *((?:M|Tu|W|Th|F)+) +(\d\d?):(\d\d) *[ -] *(\d\d?):(\d\d) *$/;

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