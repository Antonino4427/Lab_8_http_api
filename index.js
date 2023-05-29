

'use strict' ;

const express = require('express') ;
const morgan = require('morgan') ;
const dao=require('./dao-film');
const { check , validationResult} = require('express-validator'); // validation middleware
const app = express() ;
app.use(morgan());
app.use(express.json());

const errorFormatter = ({ location, msg, param, value, nestedErrors }) => {
    return `${location}[${param}]: ${msg}`;
  };


app.get('/api/films', (req,res)=>{
    dao.listFilms(req.query.filter).then((result)=>{
        res.json(result);

    }).catch((error)=>{
        res.status(500).send(error);
        
    })
});

app.get('/api/films/:id', [ check('id').isInt({min: 1}) ], async (req,res)=>{
    try {
        const result = await dao.FilmbyID(req.params.id);
        if(result.error) res.status(404).json(result.error);
        else res.json(result);
    } catch (err) {
        res.status(500).end();
    }
});

app.post('/api/films',
  [
    check('title').isLength({min: 1, max:160}),
    check('favorite').isBoolean(),
    // only date (first ten chars) and valid ISO
    check('watchDate').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
    check('rating').isInt({min: 0, max: 5}),
  ], async (req,res)=>{
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }
    const film={title:req.body.title, favorite:req.body.favorite, watchDate:req.body.watchDate, rating:req.body.rating};

    try {
        const result= await dao.createFilm(film);
        res.json(result);
    } catch (err) {
        res.status(500).json({error: `error creating new film: ${err}`});
    }
  });

  app.delete('/api/films/:id',[check('id').isInt()] ,async (req,res)=>{
    try {
        const result= await dao.DeleteFilm(req.params.id);
        res.json({ message:`eliminato film numero `+ result});
    } catch (err) {
        res.status(503).json({ error: `Database error during the deletion of film ${req.params.id}: ${err} ` });
    }

  })

  app.put('/api/films/:id',
  [
    check('id').isInt(),  
    check('title').isLength({min: 1, max:160}),
    check('favorite').isBoolean(),
    // only date (first ten chars) and valid ISO 
    check('watchDate').isLength({min: 10, max: 10}).isISO8601({strict: true}).optional({checkFalsy: true}),
    check('rating').isInt({min: 0, max: 5}),
  ],
  async (req, res) => {
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }
    if (req.body.id !== Number(req.params.id)) {
        return res.status(422).json({ error: 'URL and body id mismatch' });
      }
    const film={id:req.body.id, title:req.body.title, favorite:req.body.favorite, watchDate:req.body.watchDate,rating:req.body.rating}

    try {
        const result=await dao.updateFilm(req.params.id,film)
        if(result.error) 
            res.status(404).json(result);
        else
            res.json(result);
    } catch(err){
        res.status(503).json({ error: `Database error during the update of film ${req.params.id}: ${err}` });
    }
  })

  app.put('/api/films/:id/favorite',
  [
    check('id').isInt(),  
    check('favorite').isBoolean(),
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }

    // Is the id in the body equal to the id in the url?
    if (req.body.id !== Number(req.params.id)) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }

    try {
      const film = await dao.FilmbyID(req.params.id);
      if (film.error)
        return res.status(404).json(film);
      film.favorite = req.body.favorite;  // update favorite property
      const result = await dao.updateFilm(film.id, film);
      return res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the favorite update of film ${req.params.id}` });
    }
  }
);

app.put('/api/films/:id/rating',
  [
    check('id').isInt(),  
    check('rating').isInt({min:0, max:5}),
  ],
  async (req, res) => {
    // Is there any validation error?
    const errors = validationResult(req).formatWith(errorFormatter); // format error message
    if (!errors.isEmpty()) {
      return res.status(422).json({ error: errors.array().join(", ")  }); // error message is a single string with all error joined together
    }

    // Is the id in the body equal to the id in the url?
    if (req.body.id !== Number(req.params.id)) {
      return res.status(422).json({ error: 'URL and body id mismatch' });
    }

    try {
      const film = await dao.FilmbyID(req.params.id);
      if (film.error)
        return res.status(404).json(film);
      film.rating = req.body.rating;  // update rating property
      const result = await dao.updateFilm(film.id, film);
      return res.json(result); 
    } catch (err) {
      res.status(503).json({ error: `Database error during the favorite update of film ${req.params.id}` });
    }
  }
);


app.listen(3000, ()=>{console.log("Server started")}) ;