import React from "react";
import { withRouter } from "react-router";
import Header from '../component/Header.js';
import Footer from '../component/Footer.js';
import toast, { Toaster } from 'react-hot-toast';
import { Link } from "react-router-dom";
import { colorTheme } from "../util/colorTheme";
import FollowChapterRow from '../component/FollowChapterRow.js';
import Loading from '../component/Loading.js';
import { isLogged } from "../util/loginUtil.js";
import MangaBox from '../component/MangaBox.js';
import { fetch } from '@tauri-apps/api/http';


class CustomList extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            id: "",
            name: "",
            visibility: "",
            version: "",
            user: {
                id: "",
                name:""
            },
            isLogged: false,
            following: false,

            mangaIdList: [],
            mangaList: [<Loading />],
            chapterList: [],
            chapterOffset: 0,
            showChapterLoad: false,
            loadControl: {
                btnClass: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel: "Load More"
            },
            tabControl: {
                active: "title",
                btnTitle: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                btnFeed: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                contentTitle: "w-full p-2 border-2 border-gray-200 dark:border-gray-900 flex flex-wrap",
                contentFeed: "w-full hidden p-3 border-2 border-gray-200 dark:border-gray-900"
            }
        };
    }

    async componentDidMount(){
        const id = this.props.match.params.id;
        var $this = this;
        isLogged().then(function(isLogged){
            $this.setState({
                id: id,
                isLogged:isLogged
            });
            if(isLogged){
                $this.checkFollow();
            }
        });

        this.getListInfo(id);
    }

    getListInfo = (id) => {
        var $this = this;
        fetch('https://api.mangadex.org/list/' + id + '?includes[]=user')
        .then(function(response){
            let name = "";
            let visibility = "";
            let version =  "";
            let mangaIdList = [];
            let user = {
                id: "",
                name:""
            };

            name = response.data.data.attributes.name;
            visibility = response.data.data.attributes.visibility;
            version = response.data.data.attributes.version;
            
            response.data.data.relationships.map((relation) => {
                if(relation.type === "user"){
                    user.id =  relation.id;
                    user.name = relation.attributes.username;
                }
                if(relation.type === "manga"){
                    mangaIdList.push(relation.id);
                }
            });

            $this.setState({
                name: name,
                visibility: visibility,
                version: version,
                mangaIdList: mangaIdList,
                user: user
            },() => $this.getMangaList());
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving custom list data.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getMangaList = () => {
        var contentRating = [];
        if(localStorage.content){
            let content = JSON.parse(localStorage.content);
            contentRating = content.map(c => c);
        }

        var $this = this;
        let params = {
            limit: 100,            
            ids: this.state.mangaIdList,
            contentRating: contentRating
        }
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/manga?includes[]=cover_art&'+query)
        .then(function(response){
            var mangaList = [];
            response.data.data.map((result) => {
                let coverFile = "";
                result.relationships.map((relation) => {
                    switch(relation.type){
                        case "cover_art":
                            coverFile = "https://uploads.mangadex.org/covers/" +  result.id + "/" + relation.attributes.fileName + ".512.jpg";
                        break;
                    } 
                });
                
                let title = "";
                Object.keys(result.attributes.title).map(function(key){
                    if(key === "en" || title === ""){
                        title = result.attributes.title[key];
                    }
                });

                let description = "";
                Object.keys(result.attributes.description).map(function(key){
                    if(key === "en" || description === ""){
                        description = result.attributes.description[key];
                    }
                });

                mangaList.push({
                    mangaId: result.id,
                    mangaName: title,
                    cover: coverFile,
                    originalLanguage: result.attributes.originalLanguage,
                    description: description
                });
            });
            if($this.state.isLogged){
                $this.getStatistics(mangaList);
            }else{
                let list = mangaList.map((manga) => <MangaBox data={manga} />);
                $this.setState({mangaList:list});
            }            
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving manga data.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getStatistics = (mangaList) => {
        let idList = [];
        for(let a = 0; a < mangaList.length; a++){
            idList.push(mangaList[a].mangaId);
        }
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        let params = {
            manga: idList
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/statistics/manga?'+query,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            for(let a = 0; a < mangaList.length; a++){
                let mean = 0;
                let followCount = 0;
                if(response.data.statistics[mangaList[a].mangaId] !== undefined){
                    mean = response.data.statistics[mangaList[a].mangaId].rating.average;
                    if(mean === undefined || mean === null){
                        mean = 0;
                    }

                    followCount = response.data.statistics[mangaList[a].mangaId].follows;
                    if(followCount === undefined || followCount === null){
                        followCount = 0;
                    }
                }
                
                mangaList[a].meanRating = mean.toFixed(2);
                mangaList[a].followCount = followCount;
            }

            let list = mangaList.map((manga) => <MangaBox data={manga} />);
            $this.setState({
                mangaList:list
            });            
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving statistics.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getListFeed = () => {
        var translatedLanguage = ["en"];
        if(localStorage.language){
            translatedLanguage = JSON.parse(localStorage.language);
        }
        var $this = this;
        this.setState({
            loadControl: {
                btnClass: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel:  
                <div className="inline-flex">
                    <span className="mr-2">Loading</span> 
                    <img className="w-6 h-6" alt="Loading" src={process.env.PUBLIC_URL + '/spin.svg'} />
                </div>
            }
        });

        let params = {
            translatedLanguage: translatedLanguage,
            offset: this.state.chapterOffset,
            limit: 50
        }
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/list/'+this.state.id+'/feed?order[createdAt]=desc&'+query)
        .then(function(response){
            let list = [];
            let mangaList = [];
            for(let i = 0; i < response.data.data.length; i++){
                list.push(response.data.data[i].id);
                response.data.data[i].relationships.map((relation) => {
                    if(relation.type === "manga"){
                        mangaList.push(relation.id);
                    }
                });
            }

            if(response.data.total > 0){
                if($this.state.isLogged){
                    $this.getChapterRead(list,mangaList,response.data.total);
                }else{
                    $this.getChapterInfo(list,[],response.data.total);
                }
            }else{
                $this.setState({
                    chapterList: 
                    <tr className="h-10 border-b border-gray-200 dark:border-gray-900">
                        <td></td>
                        <td>No chapters found</td>
                        <td></td>
                        <td></td>
                        <td></td>
                        <td></td>
                    </tr>
                })
            }
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving chapter feed list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getChapterRead = (chapterList,mangaList,totalOffset) => {
        var $this = this;
        var bearer = "Bearer " + localStorage.getItem("authToken");
        let params = {
            ids: mangaList,
            grouped: true
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/manga/read?'+query,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            let readList = response.data.data;
            $this.getChapterInfo(chapterList,readList,totalOffset);
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving read markers list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getChapterInfo = (list,readList,totalOffset) => {
        var translatedLanguage = ["en"];
        if(localStorage.language){
            translatedLanguage = JSON.parse(localStorage.language);
        }
        var $this = this;
        let params = {
            ids: list,
            translatedLanguage: translatedLanguage,
            includes: ["scanlation_group","user","manga"],
            limit: 50
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/chapter?order[createdAt]=desc&'+query)
        .then(function(response){
            let list = $this.state.chapterList;
            for(let i = 0; i < response.data.data.length; i++){
                response.data.data[i].read = false;
                response.data.data[i].isLogged = $this.state.isLogged;
                response.data.data[i].relationships.map((relation) => {
                    if(relation.type === "manga" && Object.keys(readList).indexOf(relation.id) > -1){
                        if(readList[relation.id].indexOf(response.data.data[i].id) > -1){
                            response.data.data[i].read = true;
                        }
                    }
                });
                list.push(<FollowChapterRow data={response.data.data[i]}/>)
            }

            let offset = parseInt($this.state.chapterOffset) + 50;
            let showMore = true;
            if(offset >= totalOffset){
                showMore = false;
            }

            $this.setState({
                chapterList: list,
                chapterOffset: offset,
                showChapterLoad: showMore,
                loadControl: {
                    btnClass: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                    btnLabel: "Load More"
                }
            });
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving chapter list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    chapterLoadMore = () => {
        this.getListFeed();
    }

    checkFollow = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        fetch('https://api.mangadex.org/user/follows/list/' + this.state.id,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            let isFollowing = (response.data.result === "ok") ? true : false;
            $this.setState({
                following: isFollowing
            });
        })
        .catch(function(error){
            console.log(error);
            $this.setState({
                following: false
            });
        });
    }

    followList = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        fetch('https://api.mangadex.org/list/' + this.state.id + '/follow',{
            method: "POST",
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            if(response.data.result === "ok"){
                toast.success('Following',{
                    duration: 1000,
                    position: 'top-right',
                });
                $this.checkFollow();
            }
        })
        .catch(function(error){
            toast.error('Error following custom list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    unfollowList = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        fetch('https://api.mangadex.org/list/' + this.state.id + '/follow',{
            method: "DELETE",
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            if(response.data.result === "ok"){
                toast.success('Unfollowed',{
                    duration: 1000,
                    position: 'top-right',
                });
                $this.checkFollow();
            }
        })
        .catch(function(error){
            toast.error('Error unfollowing custom list.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    changeTabs = (tab) => {
        switch(tab){
            case "title":
                this.setState({tabControl: {
                    active: "title",
                    btnTitle: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                    btnFeed: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                    contentTitle: "w-full p-2 border-2 border-gray-200 dark:border-gray-900 flex flex-wrap",
                    contentFeed: "w-full hidden p-3 border-2 border-gray-200 dark:border-gray-900"
                }});
            break;
            case "feed":
                if(this.state.chapterList.length === 0){
                    this.getListFeed();
                }
                this.setState({tabControl: {
                    active: "feed",
                    btnTitle: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                    btnFeed: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                    contentTitle: "w-full hidden p-2 border-2 border-gray-200 dark:border-gray-900",
                    contentFeed: "w-full p-3 border-2 border-gray-200 dark:border-gray-900"
                }});
            break;
        }
    }

    render = () => {
        var actionTR = "";
        var thRead = "";
        if(this.state.isLogged){
            var btnFollow =
            <button className="text-center px-3 py-1 my-1 h-9 mr-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900" title="Follow" onClick={this.followList}>
                <div className="flex flex-wrap">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-1" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                    </svg>
                    Follow 
                </div> 
            </button>;
            if(this.state.following){
                btnFollow =
                <button className="text-center px-3 py-1 my-1 h-9 mr-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900" title="Unfollow" onClick={this.unfollow}>
                    <div className="flex flex-wrap">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 mt-1" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                        </svg>
                        Unfollow 
                    </div>
                </button>;
            }
            actionTR = 
            <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                <td width="20%" className="font-semibold">Action:</td>
                <td width="80%">{btnFollow}</td>
            </tr>

            thRead = 
            <th className="w-8" title="Read">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            </th>
        }

        var chapterLoading = (this.state.chapterList.length <= 0) ? <Loading /> : "";
        var loadMore = (this.state.showChapterLoad) ? 
        <button 
            onClick={this.chapterLoadMore} 
            className={this.state.loadControl.btnClass} >
            {this.state.loadControl.btnLabel}
        </button> : "";

        return (
            <div class="flex flex-col justify-between h-screen">
                <Toaster />
                <Header isLogged={this.state.isLogged} />
                <div className="bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <div className="container mx-auto px-4 flex flex-wrap justify-between">
                        <div className="box-border w-full py-2 mt-6 mb-2 mr-1 border-2 border-gray-200 dark:border-gray-900">
                            <div className="text-left text-lg flex flex-wrap border-b-2 pb-1 px-3 border-gray-200 dark:border-gray-900">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mx-1 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                                </svg>
                                <span className="ml-2">{this.state.name}</span>
                            </div>
                            <div className="w-full flex">
                                <table class="table-auto w-1/2 mx-3 my-2">
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                        <td width="20%" className="font-semibold">Custom List ID:</td>
                                        <td width="80%">{this.state.id}</td>
                                    </tr>                                    
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                        <td width="20%" className="font-semibold">User:</td>
                                        <td width="80%">
                                            <Link 
                                                className={"hover:opacity-75 mr-3 " + colorTheme(500).text} 
                                                to={"/user/" + this.state.user.id}>
                                                    {this.state.user.name}
                                            </Link>
                                        </td>
                                    </tr>
                                    {actionTR}
                                </table>
                                <table class="table-auto w-1/2 mx-3 my-2">
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                        <td width="20%" className="font-semibold">Visibility:</td>
                                        <td width="80%">{this.state.visibility}</td>
                                    </tr>
                                    <tr className="text-left border-b border-gray-200 dark:border-gray-900">
                                        <td width="20%" className="font-semibold">Version:</td>
                                        <td width="80%">{this.state.version}</td>
                                    </tr>
                                </table>
                            </div>
                        </div>

                        <div className="box-border w-full py-2">
                            <button onClick={() => this.changeTabs("title")} className={this.state.tabControl.btnTitle} >
                                Titles
                            </button>
                            <button onClick={() => this.changeTabs("feed")} className={this.state.tabControl.btnFeed}>
                                Feed
                            </button>
                            
                            <div className={this.state.tabControl.contentTitle}>
                                {this.state.mangaList}
                            </div>
                            <div className={this.state.tabControl.contentFeed}>
                                {chapterLoading}
                                <table class="table-fixed w-full p-2">
                                    <thead className="border-b-2 border-gray-200 dark:border-gray-900">
                                        {thRead}
                                        <th title="Chapter">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                            </svg>
                                        </th>
                                        <th title="Manga">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                                            </svg>
                                        </th>
                                        <th className="w-8" title="Language">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                            </svg>
                                        </th>
                                        <th title="Group">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        </th>
                                        <th title="Uploader">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                        </th>
                                        <th title="Age">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-right" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </th>
                                    </thead>
                                    <tbody>
                                        {this.state.chapterList}
                                    </tbody>
                                </table>
                                {loadMore}
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
} 


export default withRouter(CustomList);