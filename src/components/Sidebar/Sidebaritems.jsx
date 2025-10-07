import Home from "./Home";
import Notifications from "./Notification";
import ProfileLink from "./ProfileLink";
import Messages from "./Messages";
import {Link} from 'react-router-dom'
const Sidebaritems = () => {
  return (
    <>
        <Home />
        <Messages />
        <Notifications />
        <ProfileLink />
        
    </>
  );
};

export default Sidebaritems;