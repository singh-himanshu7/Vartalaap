package com.himanshu.chatBackend.repositories;

import com.himanshu.chatBackend.entities.Room;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface RoomRepository extends MongoRepository<Room,String> {
    Room findByRoomID(String roomID);
}
