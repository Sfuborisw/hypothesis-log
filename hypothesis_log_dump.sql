--
-- PostgreSQL database dump
--

\restrict knf9lq0tNa67uoXo2dq2lzTPRo1BQYXohTEOEsGmNA8NIzS8fAYmc2SDQOCA0Tr

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10 (Ubuntu 17.10-1.pgdg24.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: hypotheses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hypotheses (
    id integer NOT NULL,
    ticker character varying NOT NULL,
    hypothesis_date date NOT NULL,
    action character varying NOT NULL,
    entry_price double precision NOT NULL,
    predicted_direction character varying NOT NULL,
    confidence integer NOT NULL,
    timeframe character varying NOT NULL,
    target_verification_date date NOT NULL,
    reasoning character varying,
    status character varying NOT NULL,
    verified_at timestamp without time zone,
    verification_price double precision,
    actual_direction character varying,
    price_change_pct double precision,
    is_hit integer,
    post_notes character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_action CHECK (((action)::text = ANY ((ARRAY['observe'::character varying, 'buy'::character varying, 'sell'::character varying, 'hold'::character varying])::text[]))),
    CONSTRAINT ck_actual_dir CHECK (((actual_direction)::text = ANY ((ARRAY['up'::character varying, 'down'::character varying, 'sideways'::character varying])::text[]))),
    CONSTRAINT ck_confidence CHECK (((confidence >= 1) AND (confidence <= 5))),
    CONSTRAINT ck_is_hit CHECK ((is_hit = ANY (ARRAY[0, 1]))),
    CONSTRAINT ck_pred_dir CHECK (((predicted_direction)::text = ANY ((ARRAY['up'::character varying, 'down'::character varying, 'sideways'::character varying])::text[]))),
    CONSTRAINT ck_status CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'verified'::character varying, 'cancelled'::character varying])::text[])))
);


--
-- Name: hypotheses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.hypotheses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: hypotheses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.hypotheses_id_seq OWNED BY public.hypotheses.id;


--
-- Name: hypothesis_signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.hypothesis_signals (
    hypothesis_id integer NOT NULL,
    signal_id integer NOT NULL
);


--
-- Name: signals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.signals (
    id integer NOT NULL,
    code character varying NOT NULL,
    name character varying NOT NULL,
    category character varying,
    description character varying,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT ck_signal_category CHECK (((category)::text = ANY ((ARRAY['bullish'::character varying, 'bearish'::character varying, 'neutral'::character varying])::text[])))
);


--
-- Name: signals_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.signals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: signals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.signals_id_seq OWNED BY public.signals.id;


--
-- Name: hypotheses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypotheses ALTER COLUMN id SET DEFAULT nextval('public.hypotheses_id_seq'::regclass);


--
-- Name: signals id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals ALTER COLUMN id SET DEFAULT nextval('public.signals_id_seq'::regclass);


--
-- Data for Name: hypotheses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hypotheses (id, ticker, hypothesis_date, action, entry_price, predicted_direction, confidence, timeframe, target_verification_date, reasoning, status, verified_at, verification_price, actual_direction, price_change_pct, is_hit, post_notes, created_at, updated_at) FROM stdin;
8	MU	2026-05-31	buy	145	up	4	1M	2026-06-30	HBM demand from AI accelerators tightening DRAM supply.	verified	2026-06-30 23:34:41.726008	168	up	15.9	1	Thesis played out; supply tightness confirmed by guidance.	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
9	NVDA	2026-06-05	buy	178	up	5	1M	2026-07-05	Data-center capex cycle still accelerating into next quarter.	verified	2026-07-05 23:34:41.726018	195	up	9.6	1	Momentum held through earnings.	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
10	TSM	2026-06-20	buy	210	up	3	1W	2026-06-27	Advanced-node pricing power ahead of quarterly update.	verified	2026-06-27 23:34:41.726029	202	down	-3.8	0	Missed — broad semi pullback overrode the thesis.	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
11	AMD	2026-06-22	observe	165	sideways	2	2W	2026-07-06	Range-bound pending MI-series traction signals.	verified	2026-07-06 23:34:41.726038	167	sideways	1.2	1	Consolidated as expected.	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
12	MU	2026-07-05	buy	172	up	4	1M	2026-08-04	Follow-through on HBM3E ramp into next earnings.	pending	\N	\N	\N	\N	\N	\N	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
13	AVGO	2026-07-07	buy	340	up	3	3M	2026-10-03	Custom-silicon backlog supports multi-quarter growth.	pending	\N	\N	\N	\N	\N	\N	2026-07-11 00:00:00.669414	2026-07-11 00:00:00.669414
\.


--
-- Data for Name: hypothesis_signals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.hypothesis_signals (hypothesis_id, signal_id) FROM stdin;
\.


--
-- Data for Name: signals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.signals (id, code, name, category, description, created_at) FROM stdin;
\.


--
-- Name: hypotheses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.hypotheses_id_seq', 13, true);


--
-- Name: signals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.signals_id_seq', 1, false);


--
-- Name: hypotheses hypotheses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypotheses
    ADD CONSTRAINT hypotheses_pkey PRIMARY KEY (id);


--
-- Name: hypothesis_signals hypothesis_signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypothesis_signals
    ADD CONSTRAINT hypothesis_signals_pkey PRIMARY KEY (hypothesis_id, signal_id);


--
-- Name: signals signals_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_code_key UNIQUE (code);


--
-- Name: signals signals_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_name_key UNIQUE (name);


--
-- Name: signals signals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.signals
    ADD CONSTRAINT signals_pkey PRIMARY KEY (id);


--
-- Name: hypothesis_signals hypothesis_signals_hypothesis_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypothesis_signals
    ADD CONSTRAINT hypothesis_signals_hypothesis_id_fkey FOREIGN KEY (hypothesis_id) REFERENCES public.hypotheses(id) ON DELETE CASCADE;


--
-- Name: hypothesis_signals hypothesis_signals_signal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.hypothesis_signals
    ADD CONSTRAINT hypothesis_signals_signal_id_fkey FOREIGN KEY (signal_id) REFERENCES public.signals(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict knf9lq0tNa67uoXo2dq2lzTPRo1BQYXohTEOEsGmNA8NIzS8fAYmc2SDQOCA0Tr

