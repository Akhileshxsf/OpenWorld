import Home from "./Home";
import Notifications from "./Notification";
import ProfileLink from "./ProfileLink";
import SellTime from "./SellTime";
import Search from "./Search";
import {Link} from 'react-router-dom'
const Sidebaritems = () => {
  return (
    <>
        <Home />
        <Search />
        <Notifications />
        <SellTime />
        <ProfileLink />
        
    </>
  );
};

export default Sidebaritems;