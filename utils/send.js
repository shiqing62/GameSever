const flatBuffers = require('../node_modules/flatbuffers/js/flatbuffers');
const Message = require('../schemas/generated/javascript/game/message').Message;
const { payloadBuilder } = require('./payloadBuilder');

function send(ws,msgId,payload){

    const Builder = flatBuffers.Builder;
    const builder = new Builder(1024);
    console.log('---server msgId: ',msgId);
    const entry = payloadBuilder[msgId];

    if (!entry)
    {
        console.error(`No PayloadType for msgId ${msgId}`);
        return;
    }

    console.log('---server payloadType: ',entry.payloadType);
    const payloadOffset = entry.build(builder,payload);
    Message.startMessage(builder);
    Message.addMsgId(builder,msgId);
    Message.addPayloadType(builder,entry.payloadType);
    Message.addPayload(builder,payloadOffset);
    builder.finish(Message.endMessage(builder));

    ws.send(builder.asUint8Array());
}

module.exports = {send};