import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import User from '../models/User.js';
import Channel from '../models/Channel.js';

export const register = async(req, res) =>
{
    try{
        const {username,email,password,role,channelName,channelDescription} = req.body;
        const userExists = await User.findOne({$or: [{email},{username}]});
        if(userExists)
        {
            return res.status(400).json({
                success: false, 
                error: 'User already exists' 
            });
        }
        if(role==='teacher'&&!channelName)
        {
            return res.status(400).json({message: 'Teacher must provide a channel name'});
        }
        //hashpassword
        const hashedPassword = await bcrypt.hash(password,10);

        //create user
        const user = new User({
            username,
            email,
            password: hashedPassword,
            role,
            ...(role === 'teacher' && { channelName, channelDescription })

        });
        
        await user.save();

        // Create a channel document for teachers
        if (role === 'teacher') {
         const channel = new Channel({
            owner: user._id,
            channelName: channelName,
            description: channelDescription || '',
            profileImage: '', // Default or placeholder
            bannerImage: '', // Default or placeholder
            subscribers: [],
            subscriberCount: 0,
            totalViews: 0,
            videos: [],
            videoCount: 0
        });
        
        await channel.save();
        console.log('✅ Channel created successfully:', {
            channelId: channel._id,
            channelName: channel.channelName
        });
    }

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});

        res.status(201).json({
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                channelName: user.channelName,
            },
            token
        });
    }
    catch(error)
    {
        res.status(400).json({error: error.message});
    }
};

export const login = async(req, res) =>
{
    try
    {
        const {email,password} = req.body;
        const user = await User.findOne({email});
        if(!user)
        {
            
            return res.status(401).json({message: 'User not found'});
        }

        //check password
        const isPasswordValid = await bcrypt.compare(password,user.password);
        if(!isPasswordValid)
        {
            return res.status(401).json({message: 'Incorrect password'});
        }

        const token = jwt.sign({userId: user._id}, process.env.JWT_SECRET,{expiresIn: '7d'});

        res.status(200).json({
            user:{
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role,
                channelName: user.channelName,
            },
            token
        });
    }
    catch(error)
    {
        res.status(400).json({error: error.message});
    }
}