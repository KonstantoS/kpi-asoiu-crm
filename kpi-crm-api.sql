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
-- Name: document_groups; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE document_groups (
    doc_id integer NOT NULL,
    group_id integer NOT NULL,
    access smallint DEFAULT 1
);


ALTER TABLE document_groups OWNER TO asoiu;

--
-- Name: COLUMN document_groups.access; Type: COMMENT; Schema: public; Owner: asoiu
--

COMMENT ON COLUMN document_groups.access IS '001:read, 010: write, 100: modify';


--
-- Name: document_users; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE document_users (
    doc_id integer NOT NULL,
    user_id integer NOT NULL,
    access smallint DEFAULT 1
);


ALTER TABLE document_users OWNER TO asoiu;

--
-- Name: COLUMN document_users.access; Type: COMMENT; Schema: public; Owner: asoiu
--

COMMENT ON COLUMN document_users.access IS '001:read, 010: write, 100: modify';


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
    parent_id integer DEFAULT 0,
    doctype character varying(50),
    original_name character varying(255) NOT NULL,
    title character varying(100),
    "desc" character varying(255),
    owner_id integer NOT NULL,
    access smallint DEFAULT 0,
    tags character varying(255),
    hash character varying(40),
    update_time timestamp without time zone DEFAULT now()
);


ALTER TABLE documents OWNER TO asoiu;

--
-- Name: event_documents; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE event_documents (
    event_id integer NOT NULL,
    document_id integer NOT NULL
);


ALTER TABLE event_documents OWNER TO asoiu;

--
-- Name: event_users; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE event_users (
    event_id integer NOT NULL,
    user_id integer NOT NULL,
    status smallint NOT NULL
);


ALTER TABLE event_users OWNER TO asoiu;

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
-- Name: groups_id_seq; Type: SEQUENCE; Schema: public; Owner: asoiu
--

CREATE SEQUENCE groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE groups_id_seq OWNER TO asoiu;

--
-- Name: groups; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE groups (
    id integer DEFAULT nextval('groups_id_seq'::regclass) NOT NULL,
    name character varying(50) NOT NULL,
    start_year smallint,
    end_year smallint,
    fulltime boolean DEFAULT true,
    speciality_code character varying(100),
    type smallint DEFAULT 1
);


ALTER TABLE groups OWNER TO asoiu;

--
-- Name: COLUMN groups.type; Type: COMMENT; Schema: public; Owner: asoiu
--

COMMENT ON COLUMN groups.type IS '1: Бакалавр, 2:Специалист, 3: Магистр';


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
-- Name: user_groups; Type: TABLE; Schema: public; Owner: asoiu; Tablespace: 
--

CREATE TABLE user_groups (
    user_id integer NOT NULL,
    group_id integer NOT NULL,
    role smallint DEFAULT 1
);


ALTER TABLE user_groups OWNER TO asoiu;

--
-- Name: COLUMN user_groups.role; Type: COMMENT; Schema: public; Owner: asoiu
--

COMMENT ON COLUMN user_groups.role IS '2x0001: Member, 2x0010: Author, 2x0100: Moderator ';


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
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: asoiu
--

INSERT INTO users VALUES (1, 'admin', '068451a8cd130bab029837e87107801006c65c4b2c76a69e0373cbba7891f874', 'Левицький Костянтин Костянтинович', 'is4311@asu.kpi.ua', 8, '', '', '', '2015-06-27 01:25:58.46347');
INSERT INTO users VALUES (4, 'is0001', '068451a8cd130bab029837e87107801006c65c4b2c76a69e0373cbba7891f874', 'Андрійко Андрій Андрійович', 'is0001@asu.kpi.ua', 1, '', '', '', '2015-07-02 21:11:07.914135');
INSERT INTO users VALUES (5, 'orlando', '068451a8cd130bab029837e87107801006c65c4b2c76a69e0373cbba7891f874', 'Орел Ігор Володимирович', 'is0002@asu.kpi.ua', 4, '', '', '', '2015-08-07 00:19:50.055606');


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: asoiu
--

SELECT pg_catalog.setval('users_id_seq', 5, true);


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
-- Name: groups_pkey; Type: CONSTRAINT; Schema: public; Owner: asoiu; Tablespace: 
--

ALTER TABLE ONLY groups
    ADD CONSTRAINT groups_pkey PRIMARY KEY (id);


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
    ADD CONSTRAINT contacts_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: contacts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY contacts
    ADD CONSTRAINT contacts_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: document_groups_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY document_groups
    ADD CONSTRAINT document_groups_doc_id_fkey FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE;


--
-- Name: document_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY document_groups
    ADD CONSTRAINT document_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;


--
-- Name: document_users_doc_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY document_users
    ADD CONSTRAINT document_users_doc_id_fkey FOREIGN KEY (doc_id) REFERENCES documents(id) ON DELETE CASCADE;


--
-- Name: document_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY document_users
    ADD CONSTRAINT document_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: documents_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY documents
    ADD CONSTRAINT documents_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES users(id);


--
-- Name: event_documents_document_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY event_documents
    ADD CONSTRAINT event_documents_document_id_fkey FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;


--
-- Name: event_documents_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY event_documents
    ADD CONSTRAINT event_documents_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;


--
-- Name: event_users_event_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY event_users
    ADD CONSTRAINT event_users_event_id_fkey FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE;


--
-- Name: event_users_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY event_users
    ADD CONSTRAINT event_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


--
-- Name: events_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY events
    ADD CONSTRAINT events_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);


--
-- Name: news_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY news
    ADD CONSTRAINT news_author_id_fkey FOREIGN KEY (author_id) REFERENCES users(id);


--
-- Name: user_groups_group_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY user_groups
    ADD CONSTRAINT user_groups_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE;


--
-- Name: user_groups_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: asoiu
--

ALTER TABLE ONLY user_groups
    ADD CONSTRAINT user_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;


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

