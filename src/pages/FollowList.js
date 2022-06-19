import React from "react";
import Header from '../component/Header.js';
import Footer from '../component/Footer.js';
import toast, { Toaster } from 'react-hot-toast';
import Loading from '../component/Loading.js';
import { isLogged } from "../util/loginUtil.js";
import FollowListRow from '../component/FollowListRow';
import { fetch } from '@tauri-apps/api/http';


class FollowList extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isLogged: false,
            listFollows: [],
            total: -1,
            offset: 0,
        };
    }

    async componentDidMount(){    
        var $this = this;
        isLogged().then(function(isLogged){
            if(isLogged){
                $this.setState({isLogged:isLogged});
                $this.getListFollows();
            }else{
                window.location = "#/";
            }
        });
    }

    getListFollows = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        let params = {
            limit: 100,
            offset: this.state.offset
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/user/follows/list?'+query,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            console.log(response);
            let list = $this.state.listFollows;
            let users = [];
            for(let i = 0; i < response.data.data.length; i++){
                let temp = {
                    id: response.data.data[i].id,
                    name: response.data.data[i].attributes.name,
                    user: {id:"",name:""},
                    follow: true
                }
                response.data.data[i].relationships.map((relation) => {
                    if(relation.type === "user"){
                        temp.user.id = relation.id;
                        users.push(relation.id);
                    }
                });
                list.push(temp);
            }

            var emptyBox = [{
                id: "",
                name: "No custom lists found.",
                user: {id:"",name:""},
                follow: false
            }];
            if(response.data.total === 0){
                list = emptyBox;
            }

            $this.setState({
                listFollows: list,
                total: response.data.total
            },() => $this.getUsers(users));
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving custom list follows.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getUsers = (users) => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        let params = {
            limit: 100,
            ids: users
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/user?'+query,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            let list = $this.state.listFollows;
            for(let i = 0; i < response.data.data.length; i++){
                let idUser = response.data.data[i].id; 
                let name = response.data.data[i].attributes.username;
                for(let a = 0; a < list.length; a++){
                    if(list[a].user.id === idUser){
                        list[a].user.name = name;
                    }
                }
            }

            $this.setState({
                listFollows: list
            });
        });
    }

    render = () => {
        var boxFollows = [];
        if(this.state.listFollows.length >= this.state.total){
            this.state.listFollows.sort((a,b) => (a.name > b.name) ? 1 : ((b.name > a.name) ? -1 : 0));
            for(let c = 0; c < this.state.listFollows.length; c++){
                boxFollows.push(<FollowListRow data={this.state.listFollows[c]} />);
            }
        }

        return (
            <div class="flex flex-col justify-between">
                <Toaster />
                <Header isLogged={this.state.isLogged} />
                <div className="h-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <div className="container mx-auto px-4 flex flex-wrap justify-between min-h-screen">
                        <div className="box-border w-full py-2 my-4 mx-2">
                            <div className="w-full border-2 border-gray-200 dark:border-gray-900">
                                <div className="text-left text-lg flex flex-wrap border-b-2 pb-1 px-3 pt-2 border-gray-200 dark:border-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                    </svg>
                                    <span className="ml-2">Following Lists</span>
                                </div>
                                <div className="p-3">
                                    <table class="table-fixed w-full p-2">
                                        <thead className="border-b-2 border-gray-200 dark:border-gray-900">
                                            <th className="text-left">Name</th>
                                            <th className="text-left">User</th>
                                            <th className="text-left">Action</th>
                                        </thead>
                                        <tbody>
                                            {boxFollows}
                                        </tbody>
                                    </table>
                                </div>                                
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}

export default FollowList;