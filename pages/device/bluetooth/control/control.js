var app = getApp()
var myfunction = require('../../../../utils/myfunction');
var name
var sendbusy = false //蓝牙发送忙状态
var deviceId
var serviceId
var characteristicId
var sendtext
var platform
var switch_enter='true'
var connetTimer //计时器变量
var SearchCycle = 1000 //蓝牙搜索周期
var select//读取选择的遥控器
var flag_onload=false //表示onload了已经执行，不需要再执行onshow
var PageItems =
  [
    {
      wid: 1,
      name: '左上',
      icon: 'img/1.png',
      up: 'TZ',
      down: 'ZS',
      show: true
    },
    {
      wid: 2,
      name: '前进',
      icon: 'img/2.png',
      up: 'TZ',
      down: 'QJ',
      show: true
    },
    {
      wid: 3,
      name: '右上',
      icon: 'img/3.png',
      up: 'TZ',
      down: 'YS',
      show: true
    },
    {
      wid: 4,
      name: '左移',
      icon: 'img/4.png',
      up: 'TZ',
      down: 'ZY',
      show: true
    },
    {
      wid: 5,
      name: '停止',
      icon: 'img/5.png',
      up: 'TZ',
      down: 'TZ',
      show: true
    },
    {
      wid: 6,
      name: '右移',
      icon: 'img/6.png',
      up: 'TZ',
      down: 'YY',
      show: true
    },
    {
      wid: 7,
      name: '左下',
      icon: 'img/7.png',
      up: 'TZ',
      down: 'ZX',
      show: true
    },
    {
      wid: 8,
      name: '后退',
      icon: 'img/8.png',
      up: 'TZ',
      down: 'HT',
      show: true
    },
    {
      wid: 9,
      name: '右下',
      icon: 'img/9.png',
      up: 'TZ',
      down: 'YX',
      show: true
    }
    ,
    {
      wid: 10,
      name: '左转',
      icon: 'img/10.png',
      up: 'TZ',
      down: 'ZZ',
      show: true
    },
    {
      wid: 11,
      name: '演示',
      icon: 'img/11.png',
      up: 'TZ',
      down: 'YS',
      show: true
    },
    {
      wid: 12,
      name: '右转',
      icon: 'img/12.png',
      up: 'TZ',
      down: 'YZ',
      show: true
    }
  ]
Page({
  /**
   * 页面的初始数据
   */
  data: {
    name: '无设备',
    deviceId: null,
    serviceId: null,
    characteristicId: null,
    connect: "连接中...",
    pageItems: null,
    display: false,
    message: '',
    select: null
  },
  /**
 * 生命周期函数--监听页面显示
 */
  onShow: function () {
    var that = this
    console.log("onShow");
    // 避免重复执行
    if (!flag_onload) {
      //读取选择的遥控器
      getSelectIndex(that);
    }
    flag_onload = false;
  },

  btn_select: function () {
    var that = this
    wx.stopPullDownRefresh()
    wx.showActionSheet({
      itemList: ['遥控一', '遥控二', '遥控三', '设置'],
      success: function (res) {
        console.log('success:', res)
        //取消操作
        if (res.cancel == true) {
          //读取选择的遥控器
          getSelectIndex(that);
        }
        else
          if (res.tapIndex == 3) {
            wx.navigateTo({
              url: '../set/set'
            })
          }
          else {
            var index = res.tapIndex + 1
            //保存数据，用户选择的遥控器
            wx.setStorageSync('selectbluetooth', index)

            updata(that, index)
          }
      },
      fail: function (res) {
        console.log('fail:', res.errMsg)
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    flag_onload = true;
    console.log("onLoad");
    wx.onBLEConnectionStateChange(function (res) {
      // 该方法回调中可以用于处理连接意外断开等异常情况
      console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
      if (res.connected == false) {
        that.setData({ connect: '已断开' })
        //启动定时重新连接
        setTimeout(function () {
              //启动定时器，开始重新连接蓝牙
              connetTimer = setInterval(function () { ReapConnect(that) }, SearchCycle)
            }, 1000)
      }
      else {
        that.setData({ connect: '已连接' })
        //关闭计时器
        clearInterval(connetTimer)
      }
    })
    wx.onBLECharacteristicValueChange(function (res) {
      console.log("characteristic", res)
      console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
    })
    //读取选择的遥控器

    getSelectIndex(that);
    name = options.name
    deviceId = options.deviceId
    this.setData({
      name: name,
      deviceId: deviceId
    })

    // 获取系统信息
    wx.getSystemInfo({
      success: function (res) {
        console.log(res.model)
        console.log(res.pixelRatio)
        console.log(res.windowWidth)
        console.log(res.windowHeight)
        console.log(res.language)
        console.log(res.version)
        console.log(res.platform)
        platform = res.platform

        // 连接蓝牙
        ReapConnect(that)
      }
    })
  },
  btn_send: function (res) {
    console.log(sendtext)
    senddata(sendtext + "\r\n", deviceId, serviceId, characteristicId)
  },
  onPullDownRefresh: function () {
    var that = this
    wx.stopPullDownRefresh()
    //读取选择的遥控器
    getSelectIndex(that);
  },
  /**
 * 用户点击右上角分享
 */
  onShareAppMessage: function () {
    return {
      title: 'www.smtvoice.com',
      path: 'pages/device/bluetooth/control/control'
    }
  },
  switch_enterChange: function (e) {
    console.log('switch_enter 发生 change 事件，携带值为', e.detail.value)
    switch_enter = e.detail.value
  },

  //按下事件
  kindToggle: function (e) {
    var that = this
   touch_send(that,'down',e)
  },
  //抬起事件
  kindtocchend: function (e) {
    var that = this
    touch_send(that,'up',e)
  },

  switch2Change:function (e) {
    this.setData({
      display: e.detail.value
    })

  },
  /**
  * 生命周期函数--监听页面卸载
  */
  onUnload: function () {
    wx.closeBLEConnection({
      deviceId: deviceId,
      success: function (res) {
        console.log('断开连接', res)
      }
    })
  },

  bindKeyusername: function (e) {
    sendtext = e.detail.value
    // console.log('inputusername', inputusername)
  }
})

function senddata(str, deviceId, serviceId, characteristicId) {
  sendbusy = true
  console.log('sendbusy:',sendbusy)
  var dataview = new DataView(str2ab(str));
  var ints = new Uint8Array(dataview.byteLength);
  for (var i = 0; i < ints.length; i++) {
    ints[i] = dataview.getUint8(i);
  }
  wx.writeBLECharacteristicValue({
    deviceId: deviceId,
    serviceId: serviceId,
    characteristicId: characteristicId,
    // 这里的value是ArrayBuffer类型
    value: ints.buffer,
    success: function (res) {
      console.log('writeBLECharacteristicValue success', res.errMsg)
      console.log('发送：', str)
      sendbusy = false
    },
    fail:function(res) {
      sendbusy = false
      console.log('发送失败')
    }

  })
}

// ArrayBuffer转为字符串，参数为ArrayBuffer对象
function ab2str(buf) {
  return String.fromCharCode.apply(null, new Uint8Array(buf));
}

// 字符串转为ArrayBuffer对象，参数为字符串
function str2ab(str) {
  var buf = new ArrayBuffer(str.length);
  var bufView = new Uint8Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function updata(that, select) {
  that.setData({ select: select })
  if (app.user) {
    // 获取服务器数据
  myfunction.request(app.api_host+'wxin/bluetooth.php?type=get&num='+select+'&userid=' + app.user.userid,
    function (res) {//success
      var jsonArray =JSON.parse(res.data.item[0]);
      console.log('jsonArray', jsonArray);
      PageItems = jsonArray;
      UpdataViewlist(that);
      //保存到本地
      wx.setStorageSync('selectbluetoothconfig' + select, PageItems)
    },
    function (res) {//fail
      //读取本地配置
      wx.getStorage({
        key: 'selectbluetoothconfig' + select,
        success: function (res) {
          PageItems = res.data
          console.log('本地配置数据：', PageItems)
          UpdataViewlist(that)
        },
        fail: function () {
          console.log('无配置数据')
          console.log(PageItems)
          UpdataViewlist(that)
        }
      })
    });
  }
  else
  {
        //读取本地配置
      wx.getStorage({
        key: 'selectbluetoothconfig' + select,
        success: function (res) {
          PageItems = res.data
          console.log('本地配置数据：', PageItems)
          UpdataViewlist(that)
        },
        fail: function () {
          console.log('无配置数据')
          console.log(PageItems)
          UpdataViewlist(that)
        }
      })
  }
  

}

function getSelectIndex(that) {
  //读取选择的遥控器
  wx.getStorage({
    key: 'selectbluetooth',
    success: function (res) {
      var cmd = res.data
      console.log('选择的遥控器：', cmd)
      select = cmd
      updata(that, select)
    },
    fail: function () {
      console.log('无选择遥控器数据！')
      select = 1//没有数据默认为1
      //保存数据，用户选择的遥控器
      wx.setStorageSync('selectbluetooth', select)
      updata(that, select)
    }
  })
}

function UpdataViewlist(that,down=false,id=0) {
  var pageItems = [];
  var row = [];
  var len = PageItems.length;//
  var temp_pic =PageItems[id].icon  //图片临时变量
  len = Math.floor((len + 2) / 3) * 3;
  // 如果是按下按键，则更改相应图片
    if (down) {
      PageItems[id].icon = 'img/down.png';
    }  
    for (var i = 0; i < len; i++) {
    //需要隐藏的按键
      if (PageItems[i].show == false || PageItems[i].show == 'false') {
      PageItems[i].icon = "img/white.png"
    }
    if ((i + 1) % 3 == 0) {
      row.push(PageItems[i]);
      pageItems.push(row);
      row = [];
      continue;
    }
    else {
      row.push(PageItems[i]);
    }
  }

  that.setData({
    pageItems: pageItems
  })

  //恢复图片
  PageItems[id].icon = temp_pic
}

function ReapConnect(that) {
  wx.createBLEConnection({
          deviceId: deviceId,
          success: function (res) {
            console.log('连接蓝牙', res)
            //蓝牙连接成功
            wx.getBLEDeviceServices({
              deviceId: deviceId,
              success: function (res) {
                //设备服务获取成功
                console.log('device services:', res)
                if (platform == 'ios') {
                  serviceId = res.services[1].uuid
                  console.log('iso')
                }else {
                  serviceId = res.services[1].uuid
                  console.log('android')
                }
                that.setData({ serviceId: serviceId })
                setTimeout(function () {
                  wx.getBLEDeviceCharacteristics({
                    deviceId: deviceId,
                    serviceId: serviceId,
                    success: function (res) {
                      that.setData({
                        connect: "已连接"
                      })
                      console.log('device getBLEDeviceCharacteristics:', res)
                      characteristicId = res.characteristics["0"].uuid
                      that.setData({ characteristicId: characteristicId })
                      wx.notifyBLECharacteristicValueChange({
                        state: true, // 启用 notify 功能
                        // 这里的 deviceId 需要在上面的 getBluetoothDevices 或 onBluetoothDeviceFound 接口中获取
                        deviceId: deviceId,
                        // 这里的 serviceId 需要在上面的 getBLEDeviceServices 接口中获取
                        serviceId: serviceId,
                        // 这里的 characteristicId 需要在上面的 getBLEDeviceCharacteristics 接口中获取
                        characteristicId: characteristicId,
                        success: function (res) {
                          console.log('notifyBLECharacteristicValueChange success', res.errMsg)
                        }
                      })

                      wx.onBLECharacteristicValueChange(function (res) {
                        console.log("characteristic", res)
                        console.log(`characteristic ${res.characteristicId} has changed, now is ${res.value}`)
                      })
                    },
                    fail: function (res) {
                      console.log('失败', res)
                      if (connetTimer) {
                        that.setData({connect: "努力重连中!"})
                      }
                      else{
                        that.setData({connect: "连接失败!"})
                      }
                    }
                  })
                }, 1000)
              }
            })
          },
          fail: function (res) {
            console.log('蓝牙连接失败', res)
            if (connetTimer){
              that.setData({connect: "努力重连中!"})
            }
            else{
              that.setData({connect: "连接失败!"})
            }
          }
        })
}

//按键发送数据
function touch_send(that,active,e) {
  var str
  if (active=='down') {
      console.log('按下', e.currentTarget)
      str = PageItems[e.currentTarget.id - 1].down
      //更新界面
      UpdataViewlist(that,true,e.currentTarget.id - 1)
  }
  else
  {
      console.log('抬起：', e.currentTarget)
      str = PageItems[e.currentTarget.id - 1].up
      //更新界面
      UpdataViewlist(that)
  }

  if (PageItems[e.currentTarget.id - 1].show == true || PageItems[e.currentTarget.id - 1].show == 'true') {//判断是否需要发送
      if (switch_enter) {//判断是否需要发送回车
          str = str + "\r\n";
        }
      if (sendbusy) {//忙状态等待发送数据
        var timer
        setTimeout(function() {
          timer = setInterval(function () { 
              console.log('尝试重发')
              if (!sendbusy) {
                senddata(str, deviceId, serviceId, characteristicId)
                //关闭计时器
                clearInterval(timer)
              }
           }, 100)
          }, 200)
        }
        else
        {
          senddata(str, deviceId, serviceId, characteristicId)
        }
      that.setData({
        message: str,
      })
      //震动
      wx.vibrateShort()
  }
}