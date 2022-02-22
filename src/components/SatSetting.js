import React, {Component} from 'react';
import {Form, Button, InputNumber} from 'antd';

class SatSettingForm extends Component {

   render() {
       const {getFieldDecorator} = this.props.form; //把form传进这个SatSetting 这个component
       const formItemLayout = { //auto resize the form for different scree size
           labelCol: {
               xs: { span: 24 },
               sm: { span: 11 },
           },
           wrapperCol: {
               xs: { span: 24 },
               sm: { span: 13 },
           },
       };
       return (//拉取经纬度，高度，海拔，时长等， （altitude是个失误，指的是角度）对应原网址api
           <Form {...formItemLayout} className="sat-setting" onSubmit={this.showSatellite}>
               <Form.Item label="Longitude(degrees)">
                   {
                       getFieldDecorator("longitude", {
                           rules: [
                               {
                                   required: true,
                                   message: "Please input your Longitude",
                               }
                           ],
                       })(<InputNumber min={-180} max={180}
                                       style={{width: "100%"}}
                                       placeholder="Please input Longitude"
                       />)
                   }
               </Form.Item>

               <Form.Item label="Latitude(degrees)">
                   {
                       getFieldDecorator("latitude", {
                           rules: [
                               {
                                   required: true,
                                   message: "Please input your Latitude",
                               }
                           ],
                       })(<InputNumber placeholder="Please input Latitude"
                                       min={-90} max={90}
                                       style={{width: "100%"}}
                       />)
                   }
               </Form.Item>

               <Form.Item label="Elevation(meters)">
                   {
                       getFieldDecorator("elevation", {
                           rules: [
                               {
                                   required: true,
                                   message: "Please input your Elevation",
                               }
                           ],
                       })(<InputNumber placeholder="Please input Elevation"
                                       min={-413} max={8850}
                                       style={{width: "100%"}}
                       />)
                   }
               </Form.Item>

               <Form.Item label="Altitude(degrees)">
                   {
                       getFieldDecorator("altitude", {
                           rules: [
                               {
                                   required: true,
                                   message: "Please input your Altitude",
                               }
                           ],
                       })(<InputNumber placeholder="Please input Altitude"
                                       min={0} max={90}
                                       style={{width: "100%"}}
                       /> )
                   }
               </Form.Item>

               <Form.Item label="Duration(secs)">
                   {
                       getFieldDecorator("duration", {
                           rules: [
                               {
                                   required: true,
                                   message: "Please input your Duration",
                               }
                           ],
                       })(<InputNumber placeholder="Please input Duration" min={0} max={90} style={{width: "100%"}} />)
                   }
               </Form.Item>
               <Form.Item className="show-nearby">
                   <Button type="primary" htmlType="submit" style={{textAlign: "center"}}>
                       Find Nearby Satellite
                   </Button>
               </Form.Item>
           </Form>
       );
   }

   //定义个方法
   showSatellite = e => {
       e.preventDefault();//用js来接手，关掉default form自己的提交
       this.props.form.validateFields((err, values) => {
           if (!err) {
               // console.log('Received values of form: ', values);
               this.props.onShow(values);
           }
       });
   }
}

//先执行.create 返回一个function，然后作用在SatSettingForm，就把最开始this.props.form传进去
const SatSetting1 = Form.create({name: 'satellite-setting'})(SatSettingForm)

//SatSettingForm只是在配置
//最后传出去的SatSetting1 才是真正创造的form
export default SatSetting1;


