"use client"

import axios from "axios";
import { useState, createContext, useContext } from "react";

interface UserContextType {
  user: any | null;
  setUser: React.Dispatch<React.SetStateAction<any | null>>;
  userStatus: boolean | string;
  setUserStatus: React.Dispatch<React.SetStateAction<boolean | string>>;
  fetchUser: () => Promise<void>;
  createProject: (projectData: any) => Promise<void>;
}

export const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [userStatus,setUserStatus]=useState<boolean|string>(false);
   async function fetchUser (){
  
        const userData = await axios.get("/api/user");
        if(userData.status==200){
          console.log(userData.data)
          setUser(userData.data);
        }
      }


  


  //secret contoller

  //create 
  const createSecret = async (secretData: any) => {
    const response = await axios.post("/api/secret", secretData);
    if (response.status === 201) {
      console.log("Secret created:", response.data);
    }
  };

  //fetch secret
  const fetchSecrets = async(projectId:string)=>{
    const response = await axios.get(`/api/secret?projectId=${projectId}`);
    if (response.status === 200) {
      return response.data;
    }
    return [];
  }


  //update secret

  const updateSecret = (secretId:string, updatedData: any) => {
    return axios.put(`/api/secret?id=${secretId}`, updatedData);
  }






  //branch
  //create branch 



  //fetch branch
const fetchBranch = async (projectId: string) => {
  const response = await axios.get(`/api/branch?projectId=${projectId}`);
  if (response.status === 200) {
    return response.data;
  }
  return [];
};

//update branch
  


  //delete branch




  //end of branch

  return (
    <UserContext.Provider value={{ user, setUser,userStatus,setUserStatus,fetchUser,createSecret,fetchSecrets,fetchBranch,updateSecret}}>
      {children}
    </UserContext.Provider>
  );
};



export const useGlobalContext = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useGlobalContext must be used within a UserProvider');
  }
  return context;
}
