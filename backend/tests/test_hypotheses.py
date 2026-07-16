"""Tests for the core create → verify loop.

These go through the HTTP API, so they exercise the real behaviour:
request validation, the verification maths, and what lands in the DB.
"""


class TestCreate:
    def test_create_returns_201_and_echoes_fields(self, client, make_hypothesis):
        resp = client.post("/hypotheses", json=make_hypothesis(ticker="NVDA"))
        assert resp.status_code == 201
        body = resp.json()
        assert body["ticker"] == "NVDA"
        assert body["entry_price"] == 100.0
        assert body["predicted_direction"] == "up"

    def test_new_hypothesis_starts_pending_with_no_outcome(self, client, make_hypothesis):
        body = client.post("/hypotheses", json=make_hypothesis()).json()
        assert body["status"] == "pending"
        assert body["is_hit"] is None
        assert body["verification_price"] is None
        assert body["actual_direction"] is None

    def test_timeframe_drives_a_verification_date(self, client, make_hypothesis):
        """target_verification_date isn't supplied by the client — the
        server derives it from the timeframe."""
        body = client.post("/hypotheses", json=make_hypothesis(timeframe="1W")).json()
        assert body["target_verification_date"] is not None

    def test_created_hypothesis_is_retrievable(self, client, make_hypothesis):
        created = client.post("/hypotheses", json=make_hypothesis()).json()
        resp = client.get(f"/hypotheses/{created['id']}")
        assert resp.status_code == 200
        assert resp.json()["id"] == created["id"]

    def test_rejects_confidence_out_of_range(self, client, make_hypothesis):
        resp = client.post("/hypotheses", json=make_hypothesis(confidence=9))
        assert resp.status_code == 422

    def test_rejects_non_positive_entry_price(self, client, make_hypothesis):
        resp = client.post("/hypotheses", json=make_hypothesis(entry_price=0))
        assert resp.status_code == 422

    def test_rejects_invalid_direction(self, client, make_hypothesis):
        resp = client.post(
            "/hypotheses", json=make_hypothesis(predicted_direction="sideward")
        )
        assert resp.status_code == 422


class TestVerify:
    """Entry price is 100.0 in every case, so the verification price maps
    directly to a percentage move. The sideways band is ±2%."""

    @staticmethod
    def _create(client, make_hypothesis, **overrides):
        return client.post("/hypotheses", json=make_hypothesis(**overrides)).json()

    def test_predicted_up_and_price_rose_is_a_hit(self, client, make_hypothesis):
        h = self._create(client, make_hypothesis, predicted_direction="up")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 110.0}
        ).json()
        assert body["actual_direction"] == "up"
        assert body["is_hit"] == 1
        assert body["price_change_pct"] == 10.0

    def test_predicted_up_but_price_fell_is_a_miss(self, client, make_hypothesis):
        h = self._create(client, make_hypothesis, predicted_direction="up")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 90.0}
        ).json()
        assert body["actual_direction"] == "down"
        assert body["is_hit"] == 0
        assert body["price_change_pct"] == -10.0

    def test_predicted_down_and_price_fell_is_a_hit(self, client, make_hypothesis):
        h = self._create(client, make_hypothesis, predicted_direction="down")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 85.0}
        ).json()
        assert body["actual_direction"] == "down"
        assert body["is_hit"] == 1

    def test_small_move_counts_as_sideways(self, client, make_hypothesis):
        """+1% sits inside the ±2% band, so it's sideways — not up."""
        h = self._create(client, make_hypothesis, predicted_direction="sideways")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 101.0}
        ).json()
        assert body["actual_direction"] == "sideways"
        assert body["is_hit"] == 1

    def test_small_move_misses_a_directional_prediction(self, client, make_hypothesis):
        """Predicting 'up' and getting +1% is a miss: the move was sideways."""
        h = self._create(client, make_hypothesis, predicted_direction="up")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 101.0}
        ).json()
        assert body["actual_direction"] == "sideways"
        assert body["is_hit"] == 0

    def test_move_beyond_the_band_is_directional_not_sideways(
        self, client, make_hypothesis
    ):
        """+5% is outside ±2%, so a 'sideways' prediction misses."""
        h = self._create(client, make_hypothesis, predicted_direction="sideways")
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 105.0}
        ).json()
        assert body["actual_direction"] == "up"
        assert body["is_hit"] == 0

    def test_verifying_marks_it_verified_and_stamps_the_price(
        self, client, make_hypothesis
    ):
        h = self._create(client, make_hypothesis)
        body = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 110.0}
        ).json()
        assert body["status"] == "verified"
        assert body["verification_price"] == 110.0
        assert body["verified_at"] is not None

    def test_post_notes_are_stored(self, client, make_hypothesis):
        h = self._create(client, make_hypothesis)
        body = client.post(
            f"/hypotheses/{h['id']}/verify",
            json={"verification_price": 110.0, "post_notes": "thesis held"},
        ).json()
        assert body["post_notes"] == "thesis held"

    def test_rejects_non_positive_verification_price(self, client, make_hypothesis):
        h = self._create(client, make_hypothesis)
        resp = client.post(
            f"/hypotheses/{h['id']}/verify", json={"verification_price": 0}
        )
        assert resp.status_code == 422

    def test_verifying_an_unknown_id_is_404(self, client):
        resp = client.post(
            "/hypotheses/99999/verify", json={"verification_price": 110.0}
        )
        assert resp.status_code == 404
