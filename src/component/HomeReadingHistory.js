import React from "react";
import { Link } from "react-router-dom";
import { DateTime } from "luxon";
import { colorTheme } from "../util/colorTheme";

class HomeReadingHistory extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            chapterLabel: "",
            chapterUrl: "",
            target: "",
            rel: "",
        };
    }

    componentDidMount = () => {
        let url = (this.props.data.externalUrl === null) ? "/chapter/" + this.props.data.chapterId + "/1" : this.props.data.externalUrl;
        let target = (this.props.data.externalUrl === null) ? "" : "_blank";
        let rel = (this.props.data.externalUrl === null) ? "" : "noreferrer";
        let label = "";
        if(this.props.data.chapter){
            label += "Chapter " + this.props.data.chapter + " ";
        }
        if(label === ""){
            label += "Oneshot ";
        }

        this.setState({
            chapterLabel: label,
            chapterUrl: url,
            target: target,
            rel: rel
        });
    }

    render = () => {
        var link = 
        <Link className={colorTheme(500).text} to={this.state.chapterUrl} title={this.state.chapterLabel} target={this.state.target} rel={this.state.rel}>
            {this.state.chapterLabel}
        </Link>
        if(this.state.target === "_blank"){
            link = 
            <a className={colorTheme(500).text} href={this.state.chapterUrl} title={this.state.chapterLabel} target={this.state.target} rel={this.state.rel}>
                {this.state.chapterLabel}
                <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
            </a>
        }
        return (
            <div className="border-b-2 my-2 mx-1 border-gray-200 dark:border-gray-900">
                <div className="p-1 border-b border-gray-200 dark:border-gray-900">
                    <Link className={colorTheme(500).text} to={"/title/" + this.props.data.mangaId} title={this.props.data.manga}>
                        {this.props.data.manga}
                    </Link>
                </div>
                <div className="p-1">
                    {link}
                    <div className="float-right" title={this.props.data.readAt}>
                        {DateTime.fromISO(this.props.data.readAt).toRelative()}
                    </div>
                </div>
            </div>
        );
    }
}

export default HomeReadingHistory;