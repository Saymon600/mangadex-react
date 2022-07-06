import React from "react";
import Header from '../component/Header.js';
import Footer from '../component/Footer.js';
import { mangaContentRating,originalLanguage } from '../util/static.js';
import { colorTheme } from "../util/colorTheme";
import { saveStorage } from "../util/persistentStore.js";
import { isLogged } from "../util/loginUtil.js";
import { Store } from 'tauri-plugin-store-api';
import toast, { Toaster } from 'react-hot-toast';




class Settings extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            isLogged: false,
            languageList:[
                {value:"en",label:"English"},
                {value:"pt-br",label:"Portuguese (BR)"},
                {value:"ja",label:"Japanese"}
            ],
            colorList:[
                {value:"red",label:"Red"},
                {value:"yellow",label:"Yellow"},
                {value:"green",label:"Green"},
                {value:"blue",label:"Blue"},
                {value:"cyan",label:"Cyan"},
                {value:"purple",label:"Purple"},
                {value:"pink",label:"Pink"},
            ],
            pageLoadList:[
                {value:"0",label:"0"},
                {value:"1",label:"1"},
                {value:"3",label:"3"},
                {value:"5",label:"5"},
                {value:"10",label:"10"},
            ],
            originalLanguageList: [],
            language: ["en"],
            original: [],
            content: [],
            color: "blue",
            pageLoad: "5"
        };
    }

    componentDidMount = () => {
        if(localStorage.language){
            let language = JSON.parse(localStorage.language);
            this.setState({language:language});
        }
        if(localStorage.original){
            let original = JSON.parse(localStorage.original);
            this.setState({original:original});
        }
        if(localStorage.content){
            let content = JSON.parse(localStorage.content);
            this.setState({content:content});
        }
        if(localStorage.color){
            let color = localStorage.color;
            this.setState({color:color});
        }
        if(localStorage.pageLoad){
            let pageLoad = localStorage.pageLoad;
            this.setState({pageLoad:pageLoad});
        }

        var $this = this;
        isLogged().then(function(isLogged){
            $this.setState({isLogged:isLogged});
        });
    }

    handleLanguage = (e) => {
        let language = this.state.language;
        let index = language.indexOf(e.target.value);
        if(e.target.checked){
            if(index === -1){
                language.push(e.target.value);
            }
        }else if(index > -1){
            language.splice(index,1);
        }

        localStorage.language = JSON.stringify(language);
        saveStorage();
        this.setState({language:language});
    }

    handleOriginalLanguage = (e) =>{
        let original = this.state.original;
        let index = original.indexOf(e.target.value);
        if(e.target.checked){
            if(index === -1){
                original.push(e.target.value);
            }
        }else if(index > -1){
            original.splice(index,1);
        }

        localStorage.original = JSON.stringify(original);
        saveStorage();
        this.setState({original:original});
    }

    handleContentRating = (e) => {
        let content = this.state.content;
        let index = content.indexOf(e.target.value);
        if(e.target.checked){
            if(index === -1){
                content.push(e.target.value);
            }
        }else if(index > -1){
            content.splice(index,1);
        }

        localStorage.content = JSON.stringify(content);
        saveStorage();
        this.setState({content:content});
    }

    handleColor = (e) => {
        let color = e.target.value;

        localStorage.color = color;
        saveStorage();
        this.setState({color:color});
    }

    handlePageLoad = (e) => {
        let pageLoad = e.target.value;

        localStorage.pageLoad = pageLoad;
        saveStorage();
        this.setState({pageLoad:pageLoad});
    }

    async clearReadingHistory(){
        let confirm = await window.confirm("Do you want to clear the reading history?");
        if(confirm === true){
            const store = new Store('.dex.dat');
            let storeHistory = await store.get('readingHistory');
            if(storeHistory){
                await store.delete('readingHistory');
            }
            toast.success('Reading History Cleared.',{
                duration: 1500,
                position: 'top-right',
            });
        }
    }

    render = () => {
        var languageList = this.state.languageList.map(lan => 
        <div className="inline-flex mr-2">
            <label className="inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    value={lan.value}
                    className={"form-checkbox border-0 rounded text-gray-800 ml-1 w-5 h-5 " + colorTheme(500).accent}
                    onChange={this.handleLanguage}
                    checked={this.state.language.indexOf(lan.value) > -1}
                />
                <span className="ml-2 text-sm font-semibold">
                    {lan.label}
                </span>
            </label>
        </div>);

        var originalLanguageList = Object.keys(originalLanguage).map((lan) => 
        <div className="inline-flex mr-2">
            <label className="inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    value={lan}
                    className={"form-checkbox border-0 rounded text-gray-800 ml-1 w-5 h-5 " + colorTheme(500).accent}
                    onChange={this.handleOriginalLanguage}
                    checked={this.state.original.indexOf(lan) > -1}
                />
                <span className="ml-2 text-sm font-semibold">
                    {originalLanguage[lan]}
                </span>
            </label>
        </div>);

        var contentRating = Object.keys(mangaContentRating).map((content) => 
        <div className="inline-flex mr-2">
            <label className="inline-flex items-center cursor-pointer">
                <input
                    type="checkbox"
                    value={content}
                    className={"form-checkbox border-0 rounded text-gray-800 ml-1 w-5 h-5 " + colorTheme(500).accent}
                    onChange={this.handleContentRating}
                    checked={this.state.content.indexOf(content) > -1}
                />
                <span className="ml-2 text-sm font-semibold">
                    {mangaContentRating[content]}
                </span>
            </label>
        </div>);

        var colors = this.state.colorList.map(c => 
        <div className="inline-flex mr-2">
            <label className="inline-flex items-center cursor-pointer">
                <input
                    type="radio"
                    name="color"
                    value={c.value}
                    className={"form-checkbox border-0 rounded text-gray-800 ml-1 w-5 h-5 " + colorTheme(500).accent}
                    onChange={this.handleColor}
                    checked={this.state.color === c.value}
                />
                <span className={`ml-2 text-sm font-semibold text-${c.value}-500`}>
                    {c.label}
                </span>
            </label>
        </div>);

        var pageLoad = this.state.pageLoadList.map(p => 
            <div className="inline-flex mr-2">
                <label className="inline-flex items-center cursor-pointer">
                    <input
                        type="radio"
                        name="pageLoad"
                        value={p.value}
                        className={"form-checkbox border-0 rounded text-gray-800 ml-1 w-5 h-5 " + colorTheme(500).accent}
                        onChange={this.handlePageLoad}
                        checked={this.state.pageLoad === p.value}
                    />
                    <span className="ml-2 text-sm font-semibold">
                        {p.label}
                    </span>
                </label>
            </div>);

        return (
            <div class="flex flex-col h-screen justify-between">
                <Toaster />
                <Header isLogged={this.state.isLogged} />
                <div className="h-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-100">
                    <div className="container mx-auto px-4 flex flex-wrap justify-between">
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Translated Languages
                            </div>
                            <div className="w-full py-3">
                                {languageList}
                            </div>
                        </div>
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Original Languages
                            </div>
                            <div className="w-full py-3">
                                {originalLanguageList}
                            </div>
                        </div>
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Content Rating
                            </div>
                            <div className="w-full py-3">
                                {contentRating}
                            </div>
                        </div>
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Parallel Image Loading
                            </div>
                            <div className="w-full py-3">
                                {pageLoad}
                            </div>
                        </div>
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Color Theme
                            </div>
                            <div className="w-full py-3">
                                {colors}
                            </div>
                        </div>
                        <div className="box-border w-full py-1 my-1 mx-2">
                            <div className="w-full border-b border-gray-200 dark:border-gray-900">
                                Reading History
                            </div>
                            <div className="w-full py-3">
                                <button onClick={this.clearReadingHistory} className="w-auto mr-1 border-2 py-1 px-3 mb-2 cursor-pointer focus:outline-none hover:opacity-75 border-gray-200 dark:border-gray-900">
                                    Clear Reading History
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }
}

export default Settings;