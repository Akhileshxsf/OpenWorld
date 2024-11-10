import useAuthStore from '../store/authStore';
import useShowToast from './useShowToast'
import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { firestore } from '../firebase/firebase';

const useGetSuggestedUsers = () => {
    const [isLoading,setIsLoading] = useState(true)
    const [SuggestedTimeSellers,setSuggestedTimeSellers] = useState([])
    const authUser = useAuthStore(state => state.user)
    const showToast = useShowToast()



    useEffect(() => {
        const getSuggestedTimeSellers = async () => {
            setIsLoading(true)
        try {
            const usersRef = collection(firestore,"users")
            const q = query(
                usersRef,
                where("uid","not-in",[authUser.uid]),
                orderBy("uid"),
                limit(3)
            )

            const querySnapshot = await getDocs(q)
            const users = [];
            querySnapshot.forEach(doc => {
                users.push({...doc.data(), id: doc.id})
            })

            setSuggestedTimeSellers(users)

        } catch (error) {
            showToast("Error",error.message,"error")
        } finally{
            setIsLoading(false)
        }
    }

    if(authUser)  getSuggestedTimeSellers()
},[authUser,showToast])

     return { isLoading, SuggestedTimeSellers }
};

export default useGetSuggestedUsers;