package com.himanshu.chatBackend.entities;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

//import java.lang.annotation.Documented;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "rooms" )
public class Room {
    @Id
    private String id; //Unique Identifier
    private String roomID;
    private List<Message> messages = new ArrayList<>();
}
