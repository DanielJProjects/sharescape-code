import React, { useState } from "react";
import { useHistory } from "react-router";
import Axios from "axios";
import {
  RegisterContainer,
  RegisterWrapper,
  Header,
  Form,
  Input,
  Select,
  Option,
  BtnCont,
  SignUpBtn,
  LogInLinkCont,
  Text,
  ErrorMessage,
  LoginLink,
} from "./RegisterBoxComponents";
import { useGlobalContext } from "../../context";
import defaultPhoto from "../../images/new-user.png";
import defaultCover from "../../images/new-user-cover.png";

const RegisterBox = () => {
  const [errorMessageDisplay, setErrorMessageDisplay] = useState("none");
  const [emailMessDisplay, setEmailMessDisplay] = useState("none");

  const { setIsLoading } = useGlobalContext();

  const history = useHistory();
  const navigateTo = () => history.push("/");

  const getPosition = () => {
    return new Promise((res, rej) => {
      window.navigator.geolocation.getCurrentPosition(res, rej);
    });
  };

  const getLocation = async (position) => {
    let coords = position.coords;
    let latChange = Math.random();
    let longChange = Math.random();
    let lat = coords.latitude - latChange;
    let long = coords.longitude + longChange;

    const url = `https://trueway-geocoding.p.rapidapi.com/ReverseGeocode?location=${lat}%2C${long}&language=en&limit=1`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "x-rapidapi-host": "trueway-geocoding.p.rapidapi.com",
        "x-rapidapi-key": "4c1e7ec62cmsh3a1c7bfb5e5e298p1796fajsnadbedd5dd72e",
      },
    })
      .then((response) => {
        return response.json();
      })
      .then((res) => {
        return res.results[0];
      })
      .catch((err) => {
        console.error(err);
      });

    let textLoc = null;

    if (res.locality === null || res.region === null || res.country === null) {
      textLoc = null;
    } else {
      textLoc = res.locality + ", " + res.region + ", " + res.country;
    }

    return textLoc;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let name = e.target.name.value.trim();
    let email = e.target.email.value.trim();
    let password = e.target.password.value;
    let gender = e.target.gender.value;
    let dob = e.target.date.value;
    let location = null;

    if (!name || !email || !password || !gender || !dob) {
      setErrorMessageDisplay("block");
    } else {
      setErrorMessageDisplay("none");

      Axios.post("http://localhost:3001/checkaccount", {
        email: email,
      }).then(async (res) => {
        let message = res.data.message;
        if (message === "Email already exists") {
          setEmailMessDisplay("block");
        } else if (message === "No errors") {
          setIsLoading(true);
          setEmailMessDisplay("none");
          e.target.reset();

          if (window.navigator.geolocation) {
            let locationRes = await getPosition();
            location = await getLocation(locationRes);
          }

          Axios.post("http://localhost:3001/register", {
            name: name,
            email: email,
            password: password,
            gender: gender,
            dob: dob,
            location: location,
            profilePic: defaultPhoto,
            coverPhoto: defaultCover,
          }).then((res) => {
            console.log(res);
          });

          navigateTo();
          setIsLoading(false);
        } else {
          console.log(message);
        }
      });
    }
  };

  return (
    <>
      <RegisterContainer>
        <RegisterWrapper>
          <Header>Sign up</Header>
          <Form onSubmit={handleSubmit}>
            <Input type="text" placeholder="Full name" name="name" />
            <Input type="text" placeholder="Email address" name="email" />
            <Input type="password" placeholder="Password" name="password" />
            <Select defaultValue="default" name="gender">
              <Option disabled value="default">
                Select gender...
              </Option>
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
              <Option value="other">Other</Option>
            </Select>
            <Input type="date" name="date" />
            <ErrorMessage errorDisplay={errorMessageDisplay}>
              Please fill in all the fields.
            </ErrorMessage>
            <ErrorMessage errorDisplay={emailMessDisplay}>
              The email address is already being used.
            </ErrorMessage>
            <BtnCont>
              <SignUpBtn type="submit">Sign up</SignUpBtn>
            </BtnCont>
          </Form>
          <LogInLinkCont>
            <Text>Have an account?&nbsp;</Text>
            <LoginLink to="/">Log in</LoginLink>
          </LogInLinkCont>
        </RegisterWrapper>
      </RegisterContainer>
    </>
  );
};

export default RegisterBox;
