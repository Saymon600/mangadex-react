import React from "react";
import Header from '../component/Header.js';
import Footer from '../component/Footer.js';
import toast, { Toaster } from 'react-hot-toast';
import Loading from '../component/Loading.js';
import { isLogged } from "../util/loginUtil.js";
import ReadingListRow from '../component/ReadingListRow.js';
import ReadingListTable from '../component/ReadingListTable.js';
import { fetch } from '@tauri-apps/api/http';


class ReadingList extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isLogged: false,
            titleTabControl:{
                btnReading: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                btnReReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                btnCompleted: "text-center px-3  mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                btnOnHold: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                contentReading: "w-full min-h-screen flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                contentReReading: "hidden",
                contentCompleted: "hidden",
                contentOnHold: "hidden",
                contentPlan: "hidden",
                contentDropped: "hidden",
            },
            loadControl: {
                btnClass: "text-center px-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900 mt-4",
                btnLabel: "Load More"
            },
            boxReading: [],
            boxReReading: [],
            boxCompleted: [],
            boxOnHold: [],
            boxPlan: [],
            boxDropped: [],

            idsReading: [],
            idsReReading: [],
            idsCompleted: [],
            idsOnHold: [],
            idsPlan: [],
            idsDropped: [],

            listReading: [],
            listReReading: [],
            listCompleted: [],
            listOnHold: [],
            listPlan: [],
            listDropped: [],

            totalReading: -1,
            totalOnHold: -1,
            totalPlanToRead: -1,
            totalDropped: -1,
            totalReReading: -1,
            totalCompleted: -1,

            follows: [],
            followOffset: 0,
        };
    }

    async componentDidMount(){    
        var $this = this;
        isLogged().then(function(isLogged){
            if(isLogged){
                $this.setState({isLogged:isLogged});
                toast.loading('Retrieving Following titles...',{
                    duration: 2000,
                    position: 'top-right',
                });
                $this.getFollows();
                $this.getTitleStatus("reading")
            }else{
                window.location = "#/";
            }
        });
    }

    getFollows = () => {
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        let params = {
            limit: 100,
            offset: this.state.followOffset
        }
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/user/follows/manga?'+query,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            let follows = $this.state.follows;
            for(let i = 0; i < response.data.data.length; i++){
                follows.push(response.data.data[i].id);
            }

            let offset = parseInt($this.state.followOffset) + 100;
            let block = true;
            if(offset >= response.data.total){
                block = false;
            }
            if(block){
                $this.setState({
                    follows: follows,
                    followOffset: offset,
                },() => $this.getFollows());
            }else{
                toast.success('Following Titles retrieved.',{
                    duration: 2000,
                    position: 'top-right',
                });
                $this.setState({
                    follows: follows
                });
            }
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving title follows.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getTitleStatus = (readStatus) => {
        var $this = this;
        var bearer = "Bearer " + localStorage.getItem("authToken");

        fetch('https://api.mangadex.org/manga/status?status=' + readStatus,{
            headers: {  
                Authorization: bearer
            }
        })
        .then(function(response){
            var toastParse = "Reading";
            var reading = [];
            var onhold = [];
            var plan = [];
            var dropped = [];
            var rereading = [];
            var completed = [];
            var emptyBox = {
                mangaId: "",
                mangaName: "No titles found.",
                cover: "",
                originalLanguage: "",
                description: "",
                artist: [],
                author:[],
                readingStatus: "",
                follow: false
            };

            switch(readStatus){
                case "reading":
                    toastParse = "Reading";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalReading: 0,
                            boxReading: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
                case "on_hold":
                    toastParse = "OnHold";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalOnHold: 0,
                            boxOnHold: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
                case "plan_to_read":
                    toastParse = "Plan to Read";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalPlanToRead: 0,
                            boxPlan: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
                case "dropped":
                    toastParse = "Dropped";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalDropped: 0,
                            boxDropped: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
                case "re_reading":
                    toastParse = "Rereading";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalReReading: 0,
                            boxReReading: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
                case "completed":
                    toastParse = "Completed";
                    if(Object.keys(response.data.statuses).length === 0){
                        $this.setState({
                            totalCompleted: 0,
                            boxCompleted: [<ReadingListRow data={emptyBox} follows={$this.state.follows} />]
                        });
                    }
                break;
            }

            Object.keys(response.data.statuses).map(function(key){
                switch(response.data.statuses[key]){
                    case "reading":
                        reading.push(key);
                    break;
                    case "on_hold":
                        onhold.push(key);
                    break;
                    case "plan_to_read":
                        plan.push(key);
                    break;
                    case "dropped":
                        dropped.push(key);
                    break;
                    case "re_reading":
                        rereading.push(key);
                    break;
                    case "completed":
                        completed.push(key);
                    break;
                }
            });

            toast.success(toastParse + ' list retrieved.',{
                duration: 2000,
                position: 'top-right',
            });
            if(reading.length > 0){
                $this.setState({
                    idsReading: reading
                },() => $this.getTitleInfo("reading",1));
            }
            if(onhold.length > 0){
                $this.setState({
                    idsOnHold: onhold
                },() => $this.getTitleInfo("on_hold",1));
            }
            if(plan.length > 0){
                $this.setState({
                    idsPlan: plan
                },() => $this.getTitleInfo("plan_to_read",1));
            }
            if(dropped.length > 0){
                $this.setState({
                    idsDropped: dropped
                },() => $this.getTitleInfo("dropped",1));
            }
            if(rereading.length > 0){
                $this.setState({
                    idsReReading: rereading
                },() => $this.getTitleInfo("re_reading",1));
            }
            if(completed.length > 0){
                $this.setState({
                    idsCompleted: completed
                },() => $this.getTitleInfo("completed",1));
            }
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving title status.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getTitleInfo = (status,page) => {
        var $this = this;
        let ids = [];
        switch(status){
            case "reading":
                ids = [...this.state.idsReading];
            break;
            case "on_hold":
                ids = [...this.state.idsOnHold];
            break;
            case "plan_to_read":
                ids = [...this.state.idsPlan];
            break;
            case "dropped":
                ids = [...this.state.idsDropped];
            break;
            case "re_reading":
                ids = [...this.state.idsReReading];
            break;
            case "completed":
                ids = [...this.state.idsCompleted];
            break;
        }
        console.log(ids.length,this.state.idsReading.length);
        let pageTotal = Math.ceil(ids.length/100);
        if(pageTotal < 1){
            pageTotal = 1;
        }
        toast.loading(`Retrieving Titles: ${page}/${pageTotal}`,{
            duration: 2000,
            position: 'top-right',
        });

        ids = ids.splice((page-1)*100,100);

        let params = {
            ids: ids,
            limit: 100
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/manga?order[title]=asc&includes[]=cover_art&includes[]=author&includes[]=artist&'+query)
        .then(function(response){
            var mangaList = [];
            var idsList = [];
            response.data.data.map((result) => {
                let coverFile = "";
                let authors = [];
                let artists = [];
                idsList.push(result.id);
                result.relationships.map((relation) => {
                    switch(relation.type){
                        case "artist":
                            artists.push({id:relation.id,name:relation.attributes.name});
                        break;
                        case "author":
                            authors.push({id:relation.id,name:relation.attributes.name});
                        break;
                        case "cover_art":
                            if(relation.attributes !== undefined){
                                coverFile = "https://uploads.mangadex.org/covers/" +  result.id + "/" + relation.attributes.fileName + ".512.jpg";
                            }                            
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
                    description: description,
                    artist:artists,
                    author:authors,
                    readingStatus: status                
                });
            });

            switch(status){
                case "reading":
                    $this.setState({totalReading: ($this.state.totalReading < 0 ? mangaList.length : $this.state.totalReading + mangaList.length)});
                break;
                case "on_hold":
                    $this.setState({totalOnHold: ($this.state.totalOnHold < 0 ? mangaList.length : $this.state.totalOnHold + mangaList.length)});
                break;
                case "plan_to_read":
                    $this.setState({totalPlanToRead: ($this.state.totalPlanToRead < 0 ? mangaList.length : $this.state.totalPlanToRead + mangaList.length)});
                break;
                case "dropped":
                    $this.setState({totalDropped: ($this.state.totalDropped < 0 ? mangaList.length : $this.state.totalDropped + mangaList.length)});
                break;
                case "re_reading":
                    $this.setState({totalReReading: ($this.state.totalReReading < 0 ? mangaList.length : $this.state.totalReReading + mangaList.length)});
                break;
                case "completed":
                    $this.setState({totalCompleted: ($this.state.totalCompleted < 0 ? mangaList.length : $this.state.totalCompleted + mangaList.length)});
                break;
            }
            $this.getTitleRating(idsList,mangaList,status,page,pageTotal);
            if(page < pageTotal){
                $this.getTitleInfo(status,page+1);
            }
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving title data.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    getTitleRating = (ids,mangaList,status,page,pageTotal) => {
        toast.loading(`Retrieving Ratings: ${page}/${pageTotal}`,{
            duration: 2000,
            position: 'top-right',
        });
        var $this = this;
        var bearer = "Bearer " + localStorage.authToken;
        let params = {
            manga: ids
        };
        const queryString = require('query-string');
        let query = queryString.stringify(params,{arrayFormat: 'bracket'});
        fetch('https://api.mangadex.org/rating?'+query,{
            headers: {  
                Authorization: bearer
            }            
        })
        .then(function(response){
            for(let i = 0; i < mangaList.length; i++){
                let rating = "";
                if(response.data.ratings[mangaList[i].mangaId] !== undefined){
                    rating = response.data.ratings[mangaList[i].mangaId].rating;
                    if(rating === undefined || rating === null){
                        rating = "";
                    }
                }

                mangaList[i].rating = rating;
            }

            var list = [];
            switch(status){
                case "reading":
                    list = $this.state.listReading;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listReading:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
                case "on_hold":
                    list = $this.state.listOnHold;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listOnHold:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
                case "plan_to_read":
                    list = $this.state.listPlan;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listPlan:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
                case "dropped":
                    list = $this.state.listDropped;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listDropped:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
                case "re_reading":
                    list = $this.state.listReReading;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listReReading:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
                case "completed":
                    list = $this.state.listCompleted;
                    mangaList.map((manga) => {
                        list.push(manga);
                    });
                    $this.setState({listCompleted:list},() => {
                        if(page === pageTotal){
                            $this.orderTitles(status);
                        }                        
                    });
                break;
            }
        })
        .catch(function(error){
            console.log(error);
            toast.error('Error retrieving rating data.',{
                duration: 4000,
                position: 'top-right',
            });
        });
    }

    orderTitles = (status) => {
        var boxReading = this.state.boxReading;
        var boxReReading = this.state.boxReReading;
        var boxCompleted = this.state.boxCompleted;
        var boxOnHold = this.state.boxOnHold;
        var boxPlan = this.state.boxPlan;
        var boxDropped = this.state.boxDropped;

        switch(status){
            case "reading":
                boxReading = [];
                if(this.state.listReading.length >= this.state.totalReading){
                    this.state.listReading.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listReading.length; c++){
                        boxReading.push(<ReadingListRow data={this.state.listReading[c]} follows={this.state.follows} />);
                    }
                }
            break;
            case "on_hold":
                boxOnHold = [];
                if(this.state.listOnHold.length >= this.state.totalOnHold){
                    this.state.listOnHold.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listOnHold.length; c++){
                        boxOnHold.push(<ReadingListRow data={this.state.listOnHold[c]} follows={this.state.follows} />);
                    }
                }
            break;
            case "plan_to_read":
                boxPlan = [];
                if(this.state.listPlan.length >= this.state.totalPlanToRead){
                    this.state.listPlan.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listPlan.length; c++){
                        boxPlan.push(<ReadingListRow data={this.state.listPlan[c]} follows={this.state.follows} />);
                    }
                }
            break;
            case "dropped":
                boxDropped = [];
                if(this.state.listDropped.length >= this.state.totalDropped){
                    this.state.listDropped.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listDropped.length; c++){
                        boxDropped.push(<ReadingListRow data={this.state.listDropped[c]} follows={this.state.follows} />);
                    }
                }
            break;
            case "re_reading":
                boxReReading = [];
                if(this.state.listReReading.length >= this.state.totalReReading){
                    this.state.listReReading.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listReReading.length; c++){
                        boxReReading.push(<ReadingListRow data={this.state.listReReading[c]} />);
                    }
                }
            break;
            case "completed":
                boxCompleted = [];
                if(this.state.listCompleted.length >= this.state.totalCompleted){
                    this.state.listCompleted.sort((a,b) => (a.mangaName > b.mangaName) ? 1 : ((b.mangaName > a.mangaName) ? -1 : 0));
                    for(let c = 0; c < this.state.listCompleted.length; c++){
                        boxCompleted.push(<ReadingListRow data={this.state.listCompleted[c]} follows={this.state.follows} />);
                    }
                }
            break;
        }

        this.setState({
            boxReading: boxReading,
            boxReReading: boxReReading,
            boxCompleted: boxCompleted,
            boxOnHold: boxOnHold,
            boxPlan: boxPlan,
            boxDropped: boxDropped,
        });
    } 

    changeTitleTabs = (tab) => {
        switch(tab){
            case "reading":
                if(this.state.boxReading.length === 0){
                    this.getTitleStatus("reading");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        btnReReading: "text-center px-3 mr-3 mb-3 hover:opacity-75 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnCompleted: "text-center px-3  mr-3 mb-3 hover:opacity-75 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnOnHold: "text-center px-3 mr-3 mb-3 hover:opacity-75 py-1 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        contentReading: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                        contentReReading: "hidden",
                        contentCompleted: "hidden",
                        contentOnHold: "hidden",
                        contentPlan: "hidden",
                        contentDropped: "hidden",
                    }
                });
            break;
            case "rereading":
                if(this.state.boxReReading.length === 0){
                    this.getTitleStatus("re_reading");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnReReading: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        btnCompleted: "text-center px-3  mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnOnHold: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        contentReading: "hidden",
                        contentReReading: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                        contentCompleted: "hidden",
                        contentOnHold: "hidden",
                        contentPlan: "hidden",
                        contentDropped: "hidden",
                    }
                });
            break;
            case "completed":
                if(this.state.boxCompleted.length === 0){
                    this.getTitleStatus("completed");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnReReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnCompleted: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        btnOnHold: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        contentReading: "hidden",
                        contentReReading: "hidden",
                        contentCompleted: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                        contentOnHold: "hidden",
                        contentPlan: "hidden",
                        contentDropped: "hidden",
                    }
                });
            break;
            case "onhold":
                if(this.state.boxOnHold.length === 0){
                    this.getTitleStatus("on_hold");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnReReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnCompleted: "text-center px-3  mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnOnHold: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        contentReading: "hidden",
                        contentReReading: "hidden",
                        contentCompleted: "hidden",
                        contentOnHold: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                        contentPlan: "hidden",
                        contentDropped: "hidden",
                    }
                });
            break;
            case "plan":
                if(this.state.boxPlan.length === 0){
                    this.getTitleStatus("plan_to_read");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnReReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnCompleted: "text-center px-3  mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnOnHold: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnPlan: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        btnDropped: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        contentReading: "hidden",
                        contentReReading: "hidden",
                        contentCompleted: "hidden",
                        contentOnHold: "hidden",
                        contentPlan: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                        contentDropped: "hidden",
                    }
                });
            break;
            case "dropped":
                if(this.state.boxDropped.length === 0){
                    this.getTitleStatus("dropped");
                }
                this.setState({
                    titleTabControl:{
                        btnReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnReReading: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnCompleted: "text-center px-3  mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnOnHold: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnPlan: "text-center px-3 mr-3 mb-3 py-1 hover:opacity-75 focus:outline-none border-2 border-gray-200 dark:border-gray-900",
                        btnDropped: "text-center px-3 py-1 mr-3 mb-3 hover:opacity-75 focus:outline-none border-2 border-gray-900 dark:border-gray-200",
                        contentReading: "hidden",
                        contentReReading: "hidden",
                        contentCompleted: "hidden",
                        contentOnHold: "hidden",
                        contentPlan: "hidden",
                        contentDropped: "w-full flex flex-wrap p-3 border-t-2 border-gray-200 dark:border-gray-900",
                    }
                });
            break;
        }
    }

    render = () => {       
        return (
            <div class="flex flex-col justify-between">
                <Toaster />
                <Header isLogged={this.state.isLogged} />
                <div className="h-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <div className="container mx-auto px-4 flex flex-wrap justify-between min-h-screen">
                        <div className="box-border w-full py-2 my-4 mx-2">                            
                            <div className="w-full p-3 border-2 border-gray-200 dark:border-gray-900">
                                <button onClick={() => this.changeTitleTabs("reading")} className={this.state.titleTabControl.btnReading} >
                                    {this.state.totalReading > -1 ? "Reading (" + this.state.totalReading + ")" : "Reading"}
                                </button>
                                <button onClick={() => this.changeTitleTabs("rereading")} className={this.state.titleTabControl.btnReReading} >
                                    {this.state.totalReReading > -1 ? "Rereading (" + this.state.totalReReading + ")" : "Rereading"}
                                </button>
                                <button onClick={() => this.changeTitleTabs("completed")} className={this.state.titleTabControl.btnCompleted} >
                                    {this.state.totalCompleted > -1 ? "Completed (" + this.state.totalCompleted + ")" : "Completed"}
                                </button>
                                <button onClick={() => this.changeTitleTabs("onhold")} className={this.state.titleTabControl.btnOnHold} >
                                    {this.state.totalOnHold > -1 ? "On Hold (" + this.state.totalOnHold + ")" : "On Hold"}
                                </button>
                                <button onClick={() => this.changeTitleTabs("plan")} className={this.state.titleTabControl.btnPlan} >
                                    {this.state.totalPlanToRead > -1 ? "Plan to Read (" + this.state.totalPlanToRead + ")" : "Plan to Read"}
                                </button>
                                <button onClick={() => this.changeTitleTabs("dropped")} className={this.state.titleTabControl.btnDropped} >
                                    {this.state.totalDropped > -1 ? "Dropped (" + this.state.totalDropped + ")" : "Dropped"}
                                </button>

                                <div className={this.state.titleTabControl.contentReading}>
                                    {
                                        this.state.boxReading.length > 0 ? 
                                        <ReadingListTable data={this.state.boxReading} /> : 
                                        <Loading /> 
                                    }
                                </div>
                                <div className={this.state.titleTabControl.contentReReading}>
                                    {
                                        this.state.boxReReading.length > 0 ? 
                                        <ReadingListTable data={this.state.boxReReading} /> : 
                                        <Loading /> 
                                    }
                                </div>
                                <div className={this.state.titleTabControl.contentCompleted}>
                                    {
                                        this.state.boxCompleted.length > 0 ? 
                                        <ReadingListTable data={this.state.boxCompleted} /> : 
                                        <Loading /> 
                                    }
                                </div>
                                <div className={this.state.titleTabControl.contentOnHold}>
                                    {
                                        this.state.boxOnHold.length > 0 ? 
                                        <ReadingListTable data={this.state.boxOnHold} /> : 
                                        <Loading /> 
                                    }
                                </div>
                                <div className={this.state.titleTabControl.contentPlan}>
                                    {
                                        this.state.boxPlan.length > 0 ? 
                                        <ReadingListTable data={this.state.boxPlan} /> : 
                                        <Loading /> 
                                    }
                                </div>
                                <div className={this.state.titleTabControl.contentDropped}>
                                    {
                                        this.state.boxDropped.length > 0 ? 
                                        <ReadingListTable data={this.state.boxDropped} /> : 
                                        <Loading /> 
                                    }
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

export default ReadingList;