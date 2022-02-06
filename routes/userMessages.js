const { sequelize, Users ,Blogs, UserStrategies,Comments} = require('../models');
const express = require('express');
const jwt = require('jsonwebtoken');
require('dotenv').config();


const Joi = require('joi');
const array = require('joi/lib/types/array');
const route = express.Router();
route.use(express.json());
route.use(express.urlencoded({ extended: true }));

function authToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log(token)
    if (token == null) return res.status(401).json({ msg: err });
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    
        if (err) return res.status(403).json({ msg: err });
        req.user = user;
    
        next();
    });
}


route.get('/allBlogs', (req, res) => {
    //if( req.user.role !== "admin")return res.status(500)
    Blogs.findAll()
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
   
    
});

route.get('/blogs/:id', (req, res) => {
    Blogs.findOne({ where: { id: req.params.id }, include: ['comments'] })
    .then( rows => res.json(rows) )
    .catch( err => res.status(500).json(err) );

});

route.get('/categories', (req,res) => {
    categories =  []
   Blogs.findAll()
       .then( rows => {
           
            rows.forEach(element => {
           if(!categories.includes(element.category)){
               categories.push(element.category)
           }
               
         
           });
           res.json(categories)
       }) 
 
 
});


route.get('/blog/:category', (req,res) => {
    blogs = []
    Blogs.findAll({ include: ['comments']})
        .then( rows => {
            
             rows.forEach(element => {
            if(element.category == req.params.category){
                blogs.push(element)
            }
                
          
            });
            res.json(blogs)
        }) 
  
  
 });
 route.get('/comments/:id', (req, res) => {
    
    Comments.findAll({where: { blogId: req.params.id}, include: ['blog']})
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) ); 
 
});

//route.use(authToken);


//CREATE ---------------------------------------

route.post('/blogs', (req, res) => {
    //if(!req.user.canMakeBlogs)return res.status(500).json({ msg: "Invalid credentials"})
   
    const sema = Joi.object().keys({
        name: Joi.string().trim().min(4).max(24).required(),
        body: Joi.string().trim().min(10).max(2048).required(),
        category: Joi.string().trim().min(4).max(18).required(),
        id: Joi.number()
    });

    sema.validate(req.body, (err, result) => {
        if (err)
            res.send('skl');
        else {
           
            Blogs.create({ name: req.body.name,body: req.body.body, category: req.body.category, userId: req.body.id})
            .then( rows => res.json(rows) )
            .catch( err => res.status(500).json({ msg: "Invalid credentials"}) );
        }
    });
});

route.post('/userStrategies', (req, res) => {
    
    //console.log(req.user.id)
    const sema = Joi.object().keys({
        name: Joi.string().trim().min(4).max(24).required(),
        body: Joi.string().trim().min(4).max(2048).required(),
        data: Joi.string(),
        userId: Joi.number()
    });
    console.log(req.user.id)
    sema.validate(req.body, (err, result) => {
        if (err)
            res.send('skl');
        else {
            const obj={ 
                name: req.body.name,
                body: req.body.body, 
                data: "",
                userId: req.user.id
            }
            console.log(obj)
           
            UserStrategies.create(obj)
            .then( rows => res.json(rows) )
            .catch( err => res.status(500).json({ msg: "Invalid credentials"}) );
        }
    });
});

route.post('/comments', (req, res) => {
  
  
});


//READ   ---------------------------------------

route.get('/users', (req, res) => {
    if( req.user.role !== "admin") return  res.status(500).json(err)
    Users.findAll()
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
    
});
//get me
route.get('/user', (req, res) => {

    Users.findOne({ where: { id: req.user.id } })
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
    
});

route.get('/users/:id', (req, res) => {
    if( req.user.role !== "admin") return  res.status(500).json(err)
    Users.findOne({ where: { id: req.params.id } })
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );

});

route.get('/blogs', (req, res) => {
    if( req.user.role == "user")return res.status(500)
    Blogs.findAll({where: { userId: req.user.id}})
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
   
    
});






route.get('/userStrategies', (req, res) => {
    if(req.user.role === "admin"){
        UserStrategies.findAll()
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );

    }
    else{
        res.status(500).json(err) 
    }
    
   
    
});
//get my strategies
route.get('/userStrategies/me', (req, res) => {
    
    UserStrategies.findAll({where: { userId: req.user.id}})
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
   
    
});
route.get('/userStrategies/:id', (req, res) => {
    if(req.user.role === "admin" || req.user.id === req.params.userId ){
    UserStrategies.findOne({where: { userId: req.user.id}})
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) );
    }
    
});

route.get('/comments', (req, res) => {
    if(req.user.role === "admin"){
        Comments.findAll({ include: ['blog']})
        .then( rows => res.json(rows) )
        .catch( err => res.status(500).json(err) ); 
    }
    
});
//get comments by blog id



//UPDATE ---------------------------------------

route.put('/users/:id', (req, res) => {
    if(req.user.role !== "admin")
     return res.status(500)  
    Users.findOne({ where: { id: req.body.id } })
        .then( usr => {
            usr.name = req.body.name;
            usr.email = req.body.email;
            usr.nickname = req.body.nickname,
            usr.password = req.body.password,
            usr.canMakeBlogs = req.body.canMakeBlogs,
            usr.role = req.body.role
        

            usr.save()
                .then( rows => res.json(rows) )
                .catch( err => res.status(500).json(err) );
        })
        .catch( err => res.status(500).json(err) );

});

route.put('/userStrategie/:id', (req, res) => {
    if(req.user.role !== "admin")
     return res.status(500)  
     UserStrategies.findOne({ where: { id: req.body.id } })
        .then( usrStr => {
            usrStr.name = req.body.name;
            usrStr.body = req.body.body;
            usrStr.data = req.body.data,
        

            usrStr.save()
                .then( rows => res.json(rows) )
                .catch( err => res.status(500).json(err) );
        })
        .catch( err => res.status(500).json(err) );

});

route.put('/comment/:id', (req, res) => {
    if(req.user.role !== "admin")
     return res.status(500)  
     Comments.findOne({ where: { id: req.body.id } })
        .then( comm => {
            comm.name = req.body.name;
            comm.likes = req.body.likes;
            comm.dislikes = req.body.dislikes,
            comm.body = req.body.body,
        

            comm.save()
                .then( rows => res.json(rows) )
                .catch( err => res.status(500).json(err) );
        })
        .catch( err => res.status(500).json(err) );

});

route.put('/blogs/:id', (req, res) => {
    if(req.user.role === "admin" || req.params.userId === req.user.id){
        Blogs.findOne({ where: { id: req.body.id }, include: ['user'] })
        .then( msg => {
            msg.body = req.body.body
            msg.name = req.body.name
            msg.category = req.body.category
            msg.save()
                .then( rows => res.json(rows) )
                .catch( err => res.status(500).json(err) )
        })
        .catch( err => res.status(500).json(err) )
    }
    else
     return res.status(500)
  
})

//DELETE ---------------------------------------
route.delete('/users/:id', (req, res) => {
    if(req.user.role !== "admin")
     return res.status(500)  
   
    Users.destroy({
        where: { id: req.params.id}
    })
    .catch( err => res.status(500).json(err) );
        
});

route.delete('/blogs/:id', (req, res) => {
   
   if(req.user.role !== "admin")return res.status(500).json(err)
    Blogs.destroy({
        where: { id: req.params.id}
    })
    .catch( err => res.status(500).json(err) );
        
})


route.delete('/comments/:id', (req, res) => {
   // let a = Comments.findOne({ where: { id: req.params.id }})
    
   if(req.user.role !== "admin")return res.status(500).json(err)
    Comments.destroy({
        where: { id: req.params.id}
    })
    .catch( err => res.status(500).json(err) );
        
})

route.delete('/userStrategies/:id', (req, res) => {
    // let a = Comments.findOne({ where: { id: req.params.id }})
     
    if(req.user.role !== "admin")return res.status(500).json(err)
     UserStrategies.destroy({
         where: { id: req.params.id}
     })
     .catch( err => res.status(500).json(err) );
         
 })
module.exports = route;