import React, {Component} from 'react';
import { Row, Col } from 'antd';
import axios from 'axios';
import { NEARBY_SATELLITE, SAT_API_KEY, STARLINK_CATEGORY } from '../constants';
import SatSetting from './SatSetting';
import SatelliteList from './SatelliteList';
import WorldMap from './WorldMap';

class Main extends Component {
    constructor(){
        super();
        //定义要维护的state
        this.state = {
            satInfo: null,
            satList: null, 
            setting: null,
            isLoadingList: false
        }
    }
    render() {
        const { isLoadingList, satInfo, satList, setting } = this.state;
        return (
            <Row className='main'>
                <Col span={8} className="left-side">
                    <SatSetting onShow={this.showNearbySatellite}/>
                    <SatelliteList isLoad={isLoadingList}
                                   satInfo={satInfo}
                                   onShowMap={this.showMap} />
                </Col>
                <Col span={16} className="right-side">
                    <WorldMap satData={satList} observerData={setting} /> 
                </Col>
            </Row>
        );
    }

    //用户在点track按钮点时候，会调用
    showMap = (selected) => {
        this.setState(preState => ({
            ...preState,
            satList: [...selected] //赋值给satlist
        }))
    }

    //第一个函数，接受一个setting
    showNearbySatellite = (setting) => {
        this.setState({
            isLoadingList: true,
            setting: setting
        })
        //api call， 根据setting 拉数据
        this.fetchSatellite(setting);
    }

    //第二个函数，获得参数
    fetchSatellite= (setting) => {
        const {latitude, longitude, elevation, altitude} = setting;
        const url = `/api/${NEARBY_SATELLITE}/${latitude}/${longitude}/${elevation}/${altitude}/${STARLINK_CATEGORY}/&apiKey=${SAT_API_KEY}`;

   this.setState({
       isLoadingList: true
   });

   axios.get(url)
       .then(response => {
           console.log(response.data)
           this.setState({
               satInfo: response.data,
               isLoadingList: false
           })
       })
       .catch(error => {
           console.log('err in fetch satellite -> ', error);
       })
    }
}
export default Main;

