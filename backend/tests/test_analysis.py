"""Tests for the analysis endpoints.

The point of the whole app is the hit rate, so it's worth pinning down:
3 hits out of 4 verified hypotheses must read as 75%.
"""


def _create_and_verify(client, make_hypothesis, predicted, verify_price):
    h = client.post(
        "/hypotheses", json=make_hypothesis(predicted_direction=predicted)
    ).json()
    client.post(
        f"/hypotheses/{h['id']}/verify", json={"verification_price": verify_price}
    )
    return h["id"]


class TestOverall:
    def test_empty_log_does_not_error(self, client):
        resp = client.get("/analysis/overall")
        assert resp.status_code == 200

    def test_hit_rate_reflects_three_hits_out_of_four(self, client, make_hypothesis):
        # entry is 100.0 for all; ±2% is the sideways band
        _create_and_verify(client, make_hypothesis, "up", 110.0)    # +10% -> hit
        _create_and_verify(client, make_hypothesis, "up", 120.0)    # +20% -> hit
        _create_and_verify(client, make_hypothesis, "down", 85.0)   # -15% -> hit
        _create_and_verify(client, make_hypothesis, "up", 90.0)     # -10% -> miss

        stats = client.get("/analysis/overall").json()
        # NOTE: if hit_rate is expressed as a percentage (75.0) rather than
        # a fraction, flip this expectation — the failure will say which.
        assert stats["hit_rate"] == 0.75

    def test_pending_hypotheses_are_excluded_from_the_hit_rate(
        self, client, make_hypothesis
    ):
        _create_and_verify(client, make_hypothesis, "up", 110.0)  # hit
        client.post("/hypotheses", json=make_hypothesis())  # still pending

        stats = client.get("/analysis/overall").json()
        assert stats["hit_rate"] == 1.0


class TestBreakdowns:
    def test_by_confidence_returns_a_list(self, client, make_hypothesis):
        _create_and_verify(client, make_hypothesis, "up", 110.0)
        resp = client.get("/analysis/by-confidence")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_by_signal_returns_a_list(self, client, make_hypothesis):
        _create_and_verify(client, make_hypothesis, "up", 110.0)
        resp = client.get("/analysis/by-signal")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
