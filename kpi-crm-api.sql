--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public, pg_catalog;

--
-- Name: tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE tokens_id_seq OWNER TO asoiu;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE auth_tokens (
    id integer DEFAULT nextval('tokens_id_seq'::regclass) NOT NULL,
    uid integer NOT NULL,
    token character varying(64) NOT NULL,
    creation_time timestamp without time zone DEFAULT now(),
    expiration_time timestamp without time zone
);


ALTER TABLE auth_tokens OWNER TO asoiu;

--
-- Name: COLUMN auth_tokens.uid; Type: COMMENT; Schema: public; Owner: asoiu
--

COMMENT ON COLUMN auth_tokens.uid IS 'user_id';


--
-- Name: contacts; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE contacts (
    user_id integer NOT NULL,
    contact_id integer NOT NULL
);


ALTER TABLE contacts OWNER TO asoiu;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE documents_id_seq OWNER TO asoiu;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE documents (
    id integer DEFAULT nextval('documents_id_seq'::regclass) NOT NULL,
    parent_id integer,
    doctype character varying(50),
    original_name character varying(255) NOT NULL,
    title character varying(100),
    "desc" character varying(255),
    owner_id integer NOT NULL,
    access smallint,
    tags character varying(255),
    hash character varying(40) NOT NULL,
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE documents OWNER TO asoiu;

--
-- Name: events_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE events_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE events_id_seq OWNER TO asoiu;

--
-- Name: events; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE events (
    id integer DEFAULT nextval('events_id_seq'::regclass) NOT NULL,
    title character varying(100),
    description text,
    date timestamp without time zone,
    place character varying(100),
    plan text,
    creation_time timestamp without time zone DEFAULT now() NOT NULL,
    author_id integer NOT NULL,
    access smallint
);


ALTER TABLE events OWNER TO asoiu;

--
-- Name: events_documents; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE events_documents (
    event_id integer NOT NULL,
    document_id integer NOT NULL
);


ALTER TABLE events_documents OWNER TO asoiu;

--
-- Name: events_users; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE events_users (
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    status smallint NOT NULL
);


ALTER TABLE events_users OWNER TO asoiu;

--
-- Name: news_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE news_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE news_id_seq OWNER TO asoiu;

--
-- Name: news; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE news (
    id integer DEFAULT nextval('news_id_seq'::regclass) NOT NULL,
    title character varying(100) NOT NULL,
    content text,
    tags character varying(255),
    author_id integer NOT NULL,
    access smallint NOT NULL,
    creation_time timestamp without time zone DEFAULT now() NOT NULL,
    preview_url character varying(255)
);


ALTER TABLE news OWNER TO asoiu;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE users_id_seq OWNER TO asoiu;

--
-- Name: users; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE users (
    id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,
    login character varying(32),
    passwd character varying(64),
    name character varying(100) DEFAULT ''::character varying,
    email character varying(255),
    role smallint,
    "position" character varying(100) DEFAULT ''::character varying,
    avatar_url character varying(255) DEFAULT ''::character varying,
    about text DEFAULT ''::text,
    creation_time timestamp without time zone DEFAULT now()
);


ALTER TABLE users OWNER TO asoiu;

--
-- Name: auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY auth_tokens
    ADD CONSTRAINT auth_tokens_token_key UNIQUE (token);


--
-- Name: documents_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: events_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY events
    ADD CONSTRAINT events_pkey PRIMARY KEY (id);


--
-- Name: news_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY news
    ADD CONSTRAINT news_pkey PRIMARY KEY (id);


--
-- Name: users_login_key; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_login_key UNIQUE (login);


--
-- Name: users_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: auth_tokens_uid_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY auth_tokens
    ADD CONSTRAINT auth_tokens_uid_fkey FOREIGN KEY (uid) REFERENCES users(id);


--
-- Name: contacts_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES users(id);


--
-- Name: contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: documents_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY documents
    ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);


--
-- Name: events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY events
    ADD CONSTRAINT events_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);


--
-- Name: events_documents_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY events_documents
    ADD CONSTRAINT events_documents_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id);


--
-- Name: events_users_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY events_users
    ADD CONSTRAINT events_users_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id);


--
-- Name: events_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY events_users
    ADD CONSTRAINT events_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id);


--
-- Name: news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);


--
-- Name: public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON SCHEMA public FROM postgres;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

