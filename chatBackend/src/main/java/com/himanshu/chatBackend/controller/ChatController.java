package com.himanshu.chatBackend.controller;

import com.himanshu.chatBackend.entities.Message;
import com.himanshu.chatBackend.entities.Room;
import com.himanshu.chatBackend.payload.MessageRequest;
import com.himanshu.chatBackend.repositories.RoomRepository;
import com.himanshu.chatBackend.services.RoomService;
import org.apache.coyote.Request;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestBody;

import java.time.LocalDateTime;

@Controller
@CrossOrigin("*")
public class ChatController {
//    private ChatService chatService;
    private RoomService roomService;
    private RoomRepository roomRepository;

    public ChatController(RoomRepository roomRepository) {
        this.roomRepository = roomRepository;
    }

    @MessageMapping("/sendMessage/{roomID}")
    @SendTo("/topic/room/{roomID}")
    public Message sendMessage(
            @DestinationVariable String roomID,
            @RequestBody MessageRequest request)
    {
        Room room = roomRepository.findByRoomID(request.getRoomID());
        Message message = new Message();
        message.setContent(request.getContent());
        message.setSender(request.getSender());
        message.setTimeStamp(LocalDateTime.now());
        if(room!=null){
            room.getMessages().add(message);
            roomRepository.save(room);
        }
        else {
            throw new RuntimeException("Room not Found !!");
        }
        return message;
    }
}
